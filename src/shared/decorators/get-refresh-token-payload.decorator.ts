import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export type RefreshTokenPayload = {
  sub: string;
  sessionId: string;
  refreshToken: string;
};

interface RequestWithRefreshTokenPayload extends Request {
  user: RefreshTokenPayload;
}

export const GetRefreshTokenPayload = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RefreshTokenPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<RequestWithRefreshTokenPayload>();
    return request.user;
  },
);
