import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@meditrack.local' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
