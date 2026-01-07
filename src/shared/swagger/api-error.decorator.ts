import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ApiErrorResponse } from '../http/api-error-response';

export function ApiError(
  status: HttpStatus,
  description: string,
): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ApiResponse({
      status,
      description,
      type: ApiErrorResponse,
    }),
  );
}
