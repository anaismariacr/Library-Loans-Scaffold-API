import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { Loan } from '../loans/entities/loan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Item, Loan])],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService, TypeOrmModule],
})
export class ItemsModule {}
