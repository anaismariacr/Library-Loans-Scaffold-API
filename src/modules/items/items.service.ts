import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(@InjectRepository(Item) private itemRepo: Repository<Item>) {}

  findAll() {
    return this.itemRepo.find();
  }

  async findOne(id: string) {
    const item = await this.itemRepo.findOneBy({ id });
    if (!item) throw new NotFoundException(`Item ${id} not found`);
    return item;
  }

  create(dto: CreateItemDto) {
    const item = this.itemRepo.create(dto);
    return this.saveItem(item);
  }

  async update(id: string, dto: UpdateItemDto) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.saveItem(item);
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    return this.itemRepo.remove(item);
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
