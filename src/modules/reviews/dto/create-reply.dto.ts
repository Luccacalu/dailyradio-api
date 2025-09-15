import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateReplyDto {
  @ApiPropertyOptional({
    description: 'A resposta para uma review ou comentário existente.',
    example:
      'Discordo quanto à linha de baixo, achei que ficou boa mas nada sensacional.',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
