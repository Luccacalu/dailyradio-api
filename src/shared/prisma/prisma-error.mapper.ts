import { Prisma } from '@prisma/client';
import { HttpStatus } from '@nestjs/common';
import { COMMON_ERRORS } from '../errors/common.errors';
import { ResolvedError } from '../errors/resolved-error.type';

export function mapPrismaError(
  exception: Prisma.PrismaClientKnownRequestError,
): ResolvedError {
  switch (exception.code) {
    case 'P2002':
      return {
        status: HttpStatus.CONFLICT,
        code: COMMON_ERRORS.DUPLICATE_RESOURCE,
        message: 'Já existe um registro com esses dados.',
      };

    case 'P2025':
      return {
        status: HttpStatus.NOT_FOUND,
        code: COMMON_ERRORS.RESOURCE_NOT_FOUND,
        message: 'Recurso não encontrado.',
      };

    case 'P2003':
      return {
        status: HttpStatus.BAD_REQUEST,
        code: COMMON_ERRORS.INVALID_RELATION,
        message: 'Erro de relacionamento entre dados.',
      };

    default:
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: COMMON_ERRORS.UNEXPECTED,
        message: 'Erro inesperado no banco de dados.',
      };
  }
}
