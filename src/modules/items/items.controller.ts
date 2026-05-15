import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ListItemsQueryDto } from './dto/list-items-query.dto';

@ApiTags('items')
@ApiBearerAuth()
@Controller('items')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Get()
  findAll(@Query() query: ListItemsQueryDto) {
    return this.itemsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateItemDto) {
    return this.itemsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.itemsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.itemsService.remove(id);
  }
}
