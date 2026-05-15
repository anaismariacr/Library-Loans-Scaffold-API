import { Module } from '@nestjs/common';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { User } from '@modules/auth/entities/user.entity';
import { Item } from '@modules/items/entities/item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from './entities/loan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, Item, User])],
  controllers: [LoansController],
  providers: [LoansService],
})
export class LoansModule {}
