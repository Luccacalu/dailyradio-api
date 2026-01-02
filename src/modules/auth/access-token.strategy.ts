import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from '../../core/database/prisma.service';
import type { Request } from 'express';

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
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            status: true,
            emailVerified: true,
          },
        },
      },
    });

    if (!session || !session.user) {
      throw new UnauthorizedException(
        'Sessão expirada ou usuário inexistente.',
      );
    }

    if (session.user.status === 'BANNED') {
      throw new UnauthorizedException('Sua conta foi desativada.');
    }

    return { ...session.user, sessionId: session.id };
  }
}
