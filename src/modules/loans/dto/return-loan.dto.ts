import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ReturnLoanDto {
  @ApiProperty()
  @IsUUID()
  loanId!: string;
}
