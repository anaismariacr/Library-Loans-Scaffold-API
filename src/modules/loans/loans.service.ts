import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Loan, LoanStatus } from './entities/loan.entity';
import { Item } from '../items/entities/item.entity';
import { User } from '../auth/entities/user.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ListLoansQueryDto } from './dto/list-loans-query.dto';

@Injectable()
export class LoansService {
  private readonly maxActiveLoans: number | undefined;
  private readonly dailyFineRate: number | undefined;
  private readonly maxLoanDays: number | undefined;

  constructor(
    @InjectRepository(Loan) private loanRepo: Repository<Loan>,
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private configService: ConfigService,
  ) {
    this.maxActiveLoans = this.configService.get<number>('loans.maxActivePerUser');
    this.dailyFineRate = this.configService.get<number>('loans.dailyFineRate');
    this.maxLoanDays = this.configService.get<number>('loans.maxLoanDays');
  }

  findAll(query: ListLoansQueryDto) {
    return this.loanRepo.find({
      where: {
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.itemId ? { itemId: query.itemId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      relations: ['user', 'item'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const loan = await this.loanRepo.findOne({
      where: { id },
      relations: ['user', 'item'],
    });
    if (!loan) throw new NotFoundException(`Loan ${id} not found`);
    return loan;
  }

  async create(dto: CreateLoanDto) {
    return this.loanRepo.manager.transaction((manager) => this.createInTransaction(manager, dto));
  }

  async returnLoan(id: string) {
    return this.loanRepo.manager.transaction((manager) => this.returnInTransaction(manager, id));
  }

  async markLost(id: string) {
    return this.loanRepo.manager.transaction((manager) => this.markLostInTransaction(manager, id));
  }

  private async createInTransaction(manager: EntityManager, dto: CreateLoanDto): Promise<Loan> {
    const userRepo = manager.getRepository(User);
    const itemRepo = manager.getRepository(Item);
    const loanRepo = manager.getRepository(Loan);
    const loanedAt = new Date();
    const dueAt = new Date(dto.dueAt);

    const user = await userRepo.findOneBy({ id: dto.userId });
    if (!user || !user.isActive) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    const item = await itemRepo.findOne({ where: { id: dto.itemId } });
    if (!item) throw new NotFoundException(`Item ${dto.itemId} not found`);
    if (!item.isActive) throw new ConflictException('Item is not active');

    const activeLoanForItem = await loanRepo.findOne({
      where: { itemId: item.id, status: LoanStatus.ACTIVE },
    });
    if (activeLoanForItem) throw new ConflictException('Item is already loaned');

    const maxActiveLoans = this.maxActiveLoans ?? 3;
    const activeLoans = await loanRepo.count({
      where: { userId: dto.userId, status: LoanStatus.ACTIVE },
    });
    if (activeLoans >= maxActiveLoans) {
      throw new ConflictException(`User already has ${maxActiveLoans} active loans`);
    }

    const maxLoanDays = this.maxLoanDays ?? 30;
    const maxDueAt = new Date(loanedAt);
    maxDueAt.setDate(maxDueAt.getDate() + maxLoanDays);
    if (dueAt <= loanedAt) {
      throw new BadRequestException('dueAt must be greater than loanedAt');
    }
    if (dueAt > maxDueAt) {
      throw new ConflictException(`dueAt cannot exceed ${maxLoanDays} days from loanedAt`);
    }

    const loan = loanRepo.create({
      user,
      userId: user.id,
      item,
      itemId: item.id,
      loanedAt,
      dueAt,
      returnedAt: null,
      status: LoanStatus.ACTIVE,
      fineAmount: 0,
    });

    return loanRepo.save(loan);
  }

  private async returnInTransaction(manager: EntityManager, id: string): Promise<Loan> {
    const loanRepo = manager.getRepository(Loan);
    const loan = await loanRepo.findOne({
      where: { id },
      relations: ['item', 'user'],
    });

    if (!loan) throw new NotFoundException(`Loan ${id} not found`);
    if (loan.status === LoanStatus.RETURNED) {
      throw new ConflictException('Loan is already returned');
    }
    if (loan.status === LoanStatus.LOST) {
      throw new ConflictException('Lost loans cannot be returned');
    }

    const returnedAt = new Date();
    const daysLate = Math.max(
      0,
      Math.ceil((returnedAt.getTime() - loan.dueAt.getTime()) / (1000 * 60 * 60 * 24)),
    );

    loan.status = LoanStatus.RETURNED;
    loan.returnedAt = returnedAt;
    loan.fineAmount = Number((daysLate * (this.dailyFineRate ?? 0.5)).toFixed(2));

    return loanRepo.save(loan);
  }

  private async markLostInTransaction(manager: EntityManager, id: string): Promise<Loan> {
    const loanRepo = manager.getRepository(Loan);
    const loan = await loanRepo.findOne({
      where: { id },
      relations: ['item', 'user'],
    });

    if (!loan) throw new NotFoundException(`Loan ${id} not found`);
    if (loan.status === LoanStatus.RETURNED) {
      throw new ConflictException('Returned loans cannot be marked as lost');
    }

    loan.status = LoanStatus.LOST;
    return loanRepo.save(loan);
  }
}
