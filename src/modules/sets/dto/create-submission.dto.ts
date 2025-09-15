import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'O título da música.',
    example: 'Smells Like Teen Spirit',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  songTitle: string;

  @ApiProperty({ description: 'O nome do artista.', example: 'Nirvana' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  artistName: string;

  @ApiPropertyOptional({
    description: 'O link do YouTube para a música.',
    example: 'https://www.youtube.com/watch?v=hTWKbfoikeg',
  })
  @IsOptional()
  @IsUrl()
  youtubeUrl?: string;

  @ApiPropertyOptional({
    description: 'O link do Spotify para a música.',
    example: 'https://open.spotify.com/track/5ghIJDpPoe3CfHMGu71E6T',
  })
  @IsOptional()
  @IsUrl()
  spotifyUrl?: string;

  @ApiPropertyOptional({
    description:
      'Observações ou comentários adicionais sobre a escolha da música.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
