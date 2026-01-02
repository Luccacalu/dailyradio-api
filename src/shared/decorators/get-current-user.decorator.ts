import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '@prisma/client';

export const GetCurrentUser = createParamDecorator<keyof User | undefined, any>(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;

    if (!user) return null;

    return data ? user[data] : user;
  },
);
