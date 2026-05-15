import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateLoanDto {
  @ApiProperty({ example: '6d3f6113-7979-4300-89a7-a5671f6a425c' })
  @IsUUID()
  itemId!: string;
}
