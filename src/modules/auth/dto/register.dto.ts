import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'jane.doe@libraryloans.local' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Strong-Password-123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Solo respetado si quien llama es admin' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
