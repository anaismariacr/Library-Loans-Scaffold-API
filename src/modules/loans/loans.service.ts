import {
  BadRequestException,
  ForbiddenException,
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

  findAll(userId?: string) {
    return this.loanRepo.find({
      where: userId ? { userId } : {},
      relations: ['user', 'item'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string) {
    const loan = await this.loanRepo.findOne({
      where: { id },
      relations: ['user', 'item'],
    });
    if (!loan) throw new NotFoundException(`Loan ${id} not found`);
    if (userId && loan.userId !== userId) {
      throw new ForbiddenException('No puedes consultar préstamos de otro usuario');
    }
    return loan;
  }

  async create(dto: CreateLoanDto, userId: string) {
    return this.loanRepo.manager.transaction((manager) =>
      this.createInTransaction(manager, dto, userId),
    );
  }

  async returnLoan(id: string, userId?: string) {
    return this.loanRepo.manager.transaction((manager) =>
      this.returnInTransaction(manager, id, userId),
    );
  }

  private async createInTransaction(
    manager: EntityManager,
    dto: CreateLoanDto,
    userId: string,
  ): Promise<Loan> {
    const userRepo = manager.getRepository(User);
    const itemRepo = manager.getRepository(Item);
    const loanRepo = manager.getRepository(Loan);

    const user = await userRepo.findOneBy({ id: userId });
    if (!user || !user.isActive) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const item = await itemRepo.findOne({ where: { id: dto.itemId } });
    if (!item) throw new NotFoundException(`Item ${dto.itemId} not found`);
    if (!item.available) throw new BadRequestException('Item is not available');

    const maxActiveLoans = this.maxActiveLoans ?? 3;
    const activeLoans = await loanRepo.count({
      where: { userId, status: LoanStatus.ACTIVE },
    });
    if (activeLoans >= maxActiveLoans) {
      throw new BadRequestException(`User already has ${maxActiveLoans} active loans`);
    }

    const maxLoanDays = this.maxLoanDays ?? 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + maxLoanDays);

    item.available = false;
    await itemRepo.save(item);

    const loan = loanRepo.create({
      user,
      userId: user.id,
      item,
      itemId: item.id,
      dueDate: dueDate.toISOString().slice(0, 10),
      returnedAt: null,
      status: LoanStatus.ACTIVE,
      fine: 0,
    });

    return loanRepo.save(loan);
  }

  private async returnInTransaction(
    manager: EntityManager,
    id: string,
    userId?: string,
  ): Promise<Loan> {
    const loanRepo = manager.getRepository(Loan);
    const itemRepo = manager.getRepository(Item);
    const loan = await loanRepo.findOne({
      where: { id },
      relations: ['item', 'user'],
    });

    if (!loan) throw new NotFoundException(`Loan ${id} not found`);
    if (userId && loan.userId !== userId) {
      throw new ForbiddenException('No puedes devolver préstamos de otro usuario');
    }
    if (loan.status === LoanStatus.RETURNED) {
      throw new BadRequestException('Loan is already returned');
    }

    const returnedAt = new Date();
    const due = new Date(`${loan.dueDate}T00:00:00.000Z`);
    const daysLate = Math.max(
      0,
      Math.ceil((returnedAt.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)),
    );

    loan.status = LoanStatus.RETURNED;
    loan.returnedAt = returnedAt;
    loan.fine = Number((daysLate * (this.dailyFineRate ?? 0.5)).toFixed(2));

    loan.item.available = true;
    await itemRepo.save(loan.item);

    return loanRepo.save(loan);
  }
}
