import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StationVisibility } from '@prisma/client';
import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsInt,
  Max,
  Min,
} from 'class-validator';

export enum StationModeDto {
  FREEFLOW = 'FREEFLOW',
  BACKSTAGE = 'BACKSTAGE',
  TOUR = 'TOUR',
}

export class CreateStationDto {
  @ApiProperty({
    description: 'O nome da estação.',
    example: 'Rock Clássico dos Anos 90',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Uma breve descrição sobre a estação.',
    example: 'Apenas as melhores músicas de rock da década de 90.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({
    description:
      'Senha para estações privadas. Deixe em branco para uma estação pública.',
    example: 'senha123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;

  @ApiProperty({
    description: 'O modo de funcionamento da estação.',
    enum: StationModeDto,
    default: StationModeDto.FREEFLOW,
  })
  @IsEnum(StationModeDto)
  mode: StationModeDto;

  @ApiPropertyOptional({
    description:
      'Máximo de músicas por usuário por set (Obrigatório para o modo FREEFLOW).',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSongsPerUserPerSet?: number;

  @ApiPropertyOptional({
    description:
      '% de membros que precisam votar para o set avançar (Obrigatório para o modo FREEFLOW).',
    example: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  votingThresholdPercent?: number;

  @ApiPropertyOptional({
    description:
      'Nº de reviews que um membro precisa fazer para poder postar uma música (Obrigatório para o modo BACKSTAGE).',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  reviewsNeededToPost?: number;

  @ApiPropertyOptional({
    description: 'A visibilidade da estação (pública ou privada).',
    enum: StationVisibility,
    default: StationVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(StationVisibility)
  visibility?: StationVisibility;
}
