import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoansService } from './loans.service';

@ApiTags('loans')
@ApiBearerAuth()
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    const userId = actor.role === UserRole.ADMIN ? undefined : actor.id;
    return this.loansService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    const userId = actor.role === UserRole.ADMIN ? undefined : actor.id;
    return this.loansService.findOne(id, userId);
  }

  @Post()
  create(@Body() dto: CreateLoanDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.loansService.create(dto, actor.id);
  }

  @Post(':id/return')
  returnLoan(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    const userId = actor.role === UserRole.ADMIN ? undefined : actor.id;
    return this.loansService.returnLoan(id, userId);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/admin-return')
  adminReturnLoan(@Param('id') id: string) {
    return this.loansService.returnLoan(id);
  }
}
