import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    example: 'Clark Kent',
    description: 'O nome completo do usuário.',
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    example: 'clark.kent@email.com',
    description: 'O endereço de e-mail único do usuário.',
  })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'clarkkent',
    description: 'O nome de usuário único, usado para login e menções.',
    minLength: 3,
  })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
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
