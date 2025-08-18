import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty({ example: 'joao.silva@email.com' })
  @IsEmail()
  email: string;
}
