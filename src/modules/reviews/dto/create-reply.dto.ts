import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateReplyDto {
  @ApiPropertyOptional({
    description: 'A resposta para uma review ou comentário existente.',
    example:
      'Discordo quanto à linha de baixo, achei que ficou boa mas nada sensacional.',
  })
  @IsNotEmpty()
  @MaxLength(5000)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  comment: string;
}
