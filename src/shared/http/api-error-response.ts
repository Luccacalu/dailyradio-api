import { ApiProperty } from '@nestjs/swagger';
import type { ErrorCode } from '../errors/error-code.type';

export class ApiErrorResponse {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'VALIDATION_ERROR' })
  error: string;

  @ApiProperty({
    example: 'USERS.NOT_FOUND',
    description: 'Código semântico do erro',
  })
  code: ErrorCode;

  @ApiProperty({
    example: 'Usuário não encontrado',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({
    example: '2025-01-01T12:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    example: '/users/me',
  })
  path: string;
}
