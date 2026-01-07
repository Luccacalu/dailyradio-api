import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../errors/error-code.type';

export class DomainException extends Error {
  constructor(
    public readonly status: HttpStatus,
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}
