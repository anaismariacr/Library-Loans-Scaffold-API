import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsISBN } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ example: 'Clean Code' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Robert C. Martin' })
  @IsString()
  author!: string;

  @ApiProperty({ example: '9780132350884' })
  @IsISBN()
  isbn!: string;
}
