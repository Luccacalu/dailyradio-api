import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from '../../core/database/prisma.service';
import type { Request } from 'express';
import { Prisma } from '@prisma/client';

type SessionWithUser = Prisma.SessionGetPayload<{
  include: { user: true };
}>;

type JwtPayload = { sub: string; sessionId: string };

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const token = req.cookies?.['access_token'] as string | undefined;
          return typeof token === 'string' ? token : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    console.log('--- JWT Strategy ---');
    console.log('Payload decodificado do token:', payload);
    const session: SessionWithUser | null =
      await this.prisma.session.findUnique({
        where: { id: payload.sessionId },
        include: { user: true },
      });

    if (!session || !session.user) {
      throw new UnauthorizedException('Sessão inválida.');
    }

    const { passwordHash: _, ...userWithoutPassword } = session.user;

    return { user: userWithoutPassword, sessionId: session.id };
  }
}
