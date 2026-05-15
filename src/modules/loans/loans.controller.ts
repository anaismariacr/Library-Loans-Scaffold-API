import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ListLoansQueryDto } from './dto/list-loans-query.dto';
import { LoansService } from './loans.service';

@ApiTags('loans')
@ApiBearerAuth()
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  findAll(@Query() query: ListLoansQueryDto) {
    return this.loansService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLoanDto) {
    return this.loansService.create(dto);
  }

  @Patch(':id/return')
  returnLoan(@Param('id') id: string) {
    return this.loansService.returnLoan(id);
  }

  @Patch(':id/mark-lost')
  markLost(@Param('id') id: string) {
    return this.loansService.markLost(id);
  }
}
