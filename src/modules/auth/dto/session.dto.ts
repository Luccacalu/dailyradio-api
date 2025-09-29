import { ApiProperty } from '@nestjs/swagger';

export class SessionDto {
  @ApiProperty({
    description: 'O ID único da sessão.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'O endereço de IP de onde a sessão foi iniciada.',
    example: '189.12.34.56',
  })
  ipAddress: string | null;

  @ApiProperty({
    description: 'O User Agent do navegador/dispositivo que iniciou a sessão.',
    example: 'Chrome on Windows',
  })
  userAgent: string | null;

  @ApiProperty({
    description: 'A data e hora em que a sessão foi criada.',
  })
  createdAt: Date;

  @ApiProperty({
    description:
      'Indica se esta é a sessão que está fazendo a requisição atual.',
    example: true,
  })
  isCurrent: boolean;
}
