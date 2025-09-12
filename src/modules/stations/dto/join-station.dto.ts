import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class JoinStationDto {
  @ApiPropertyOptional({
    description: 'A senha, caso a estação seja privada.',
    example: 'senha123',
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}
