import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @ApiPropertyOptional({
    description:
      'A nota (rating) dada à música, de 1 a 5, podendo ter uma casa decimal.',
    example: 4.5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'O comentário em texto da review.',
    example: 'Achei a linha de baixo dessa música sensacional!',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
