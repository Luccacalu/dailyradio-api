import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCurrentSessionId = createParamDecorator(
  (_: undefined, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: { sessionId: string } }>();
    return request.user?.sessionId;
  },
);
