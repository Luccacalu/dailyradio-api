import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type RefreshTokenPayload = {
  sub: string;
  sessionId: string;
  refreshToken: string;
};

export const GetRefreshTokenPayload = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RefreshTokenPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: RefreshTokenPayload }>();
    return request.user;
  },
);
