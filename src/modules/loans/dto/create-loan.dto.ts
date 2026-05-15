import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class CreateLoanDto {
  @ApiProperty({ example: '2b4a3bc9-5ab2-43c3-baa3-86476428b7bb' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: '6d3f6113-7979-4300-89a7-a5671f6a425c' })
  @IsUUID()
  itemId!: string;

  @ApiProperty({ example: '2026-06-14T23:59:59.000Z' })
  @IsDateString()
  dueAt!: string;
}
