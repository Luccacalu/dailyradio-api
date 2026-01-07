import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../http/api-error-response';
import { COMMON_ERRORS } from '../errors/common.errors';
import { DomainException } from '../exceptions/domain.exception';
import { isUnexpectedError } from '../errors/is-unexpected-error';
import { mapPrismaError } from '../prisma/prisma-error.mapper';
import { ResolvedError } from '../errors/resolved-error.type';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let resolved: ResolvedError = {
      status: 500,
      code: COMMON_ERRORS.UNEXPECTED,
      message: 'Ocorreu um erro inesperado no servidor.',
    };

    if (exception instanceof DomainException) {
      resolved.status = exception.status;
      resolved.code = exception.code;
      resolved.message = exception.message;
    } else if (exception instanceof HttpException) {
      resolved.status = exception.getStatus();
      resolved.code = COMMON_ERRORS.VALIDATION;

      const responseBody = exception.getResponse();

      if (
        typeof responseBody === 'object' &&
        responseBody !== null &&
        'message' in responseBody
      ) {
        resolved.message = (
          responseBody as { message: string | string[] }
        ).message;
      } else {
        resolved.message = responseBody as string;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = mapPrismaError(exception);

      resolved = prismaError;
    }

    if (isUnexpectedError(resolved.status)) {
      this.logger.error({
        path: request.url,
        method: request.method,
        code: resolved.code,
        message: resolved.message,
        exceptionName:
          exception instanceof Error ? exception.name : 'UnknownException',
        stack: exception instanceof Error ? exception.stack : undefined,
        rawException: exception,
      });
    }

    const errorResponse: ApiErrorResponse = {
      statusCode: resolved.status,
      error: HttpStatus[resolved.status],
      code: resolved.code,
      message: Array.isArray(resolved.message)
        ? resolved.message[0]
        : resolved.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(resolved.status).json(errorResponse);
  }
}
