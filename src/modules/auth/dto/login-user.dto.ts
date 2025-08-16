import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    example: 'joao.silva@email.com',
    description: 'O e-mail cadastrado do usuário.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'S3nh@F0rt3!',
    description: 'A senha do usuário.',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}
