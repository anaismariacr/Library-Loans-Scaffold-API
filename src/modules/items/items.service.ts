import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Loan, LoanStatus } from '../loans/entities/loan.entity';
import { ListItemsQueryDto } from './dto/list-items-query.dto';
import { ItemResponse, toItemResponse } from './dto/item-response.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(Loan) private loanRepo: Repository<Loan>,
  ) {}

  async findAll(query: ListItemsQueryDto): Promise<ItemResponse[]> {
    const items = await this.itemRepo.find({
      where: {
        isActive: true,
        ...(query.type ? { type: query.type } : {}),
      },
      order: { createdAt: 'DESC' },
    });
    const activeLoanCounts = await this.getActiveLoanCounts(items.map((item) => item.id));
    return items.map((item) => toItemResponse(item, activeLoanCounts.get(item.id) ?? 0));
  }

  async findOne(id: string): Promise<ItemResponse> {
    const item = await this.itemRepo.findOneBy({ id, isActive: true });
    if (!item) throw new NotFoundException(`Item ${id} not found`);
    const activeLoansCount = await this.loanRepo.count({
      where: { itemId: item.id, status: LoanStatus.ACTIVE },
    });
    return toItemResponse(item, activeLoansCount);
  }

  create(dto: CreateItemDto) {
    const item = this.itemRepo.create(dto);
    return this.saveItem(item);
  }

  async update(id: string, dto: UpdateItemDto) {
    const item = await this.findActiveEntity(id);
    Object.assign(item, dto);
    return this.saveItem(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findActiveEntity(id);
    item.isActive = false;
    await this.itemRepo.save(item);
  }

  private async findActiveEntity(id: string): Promise<Item> {
    const item = await this.itemRepo.findOneBy({ id, isActive: true });
    if (!item) throw new NotFoundException(`Item ${id} not found`);
    return item;
  }

  private async getActiveLoanCounts(itemIds: string[]): Promise<Map<string, number>> {
    if (itemIds.length === 0) {
      return new Map();
    }

    const rows = await this.loanRepo
      .createQueryBuilder('loan')
      .select('loan.itemId', 'itemId')
      .addSelect('COUNT(*)', 'count')
      .where('loan.itemId IN (:...itemIds)', { itemIds })
      .andWhere('loan.status = :status', { status: LoanStatus.ACTIVE })
      .groupBy('loan.itemId')
      .getRawMany<{ itemId: string; count: string }>();

    return new Map(rows.map((row) => [row.itemId, Number(row.count)]));
  }

  private async saveItem(item: Item): Promise<Item> {
    try {
      return await this.itemRepo.save(item);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException('Ya existe un item con ese código');
      }
      throw error;
    }
  }
}
