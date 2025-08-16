// src/auth/dto/register-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    example: 'João da Silva',
    description: 'O nome completo do usuário.',
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    example: 'joao.silva@email.com',
    description: 'O endereço de e-mail único do usuário.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'joaosilva',
    description: 'O nome de usuário único, usado para login e menções.',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({
    example: 'S3nh@F0rt3!',
    description: 'A senha do usuário, com no mínimo 8 caracteres.',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}
