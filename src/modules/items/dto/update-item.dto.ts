import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ItemType } from '../entities/item.entity';

export class UpdateItemDto {
  @ApiPropertyOptional({ example: 'Clean Architecture' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ enum: ItemType, example: ItemType.BOOK })
  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;
}
