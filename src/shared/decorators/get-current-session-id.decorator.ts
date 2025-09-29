import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

interface RequestWithUserAndSession extends Request {
  user: {
    user: any;
    sessionId: string;
  };
}

export const GetCurrentSessionId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithUserAndSession>();
    return request.user.sessionId;
  },
);
