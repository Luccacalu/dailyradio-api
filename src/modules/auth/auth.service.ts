import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../../core/email/email.service';
import { PrismaService } from '../../core/database/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // --- FLUXO DE REGISTRO ---

  async register(dto: RegisterUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 8);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 3600000); // 1 hora

    const user = await this.usersService.createUser({
      name: dto.name,
      email: dto.email.toLowerCase(),
      username: dto.username.toLowerCase(),
      passwordHash: hashedPassword,
      emailVerificationToken: verificationToken,
      emailTokenExpiresAt: tokenExpiresAt,
    });

    await this.emailService.sendVerificationEmail(
      user.name,
      user.email,
      verificationToken,
    );

    return {
      message:
        'Registro realizado! Verifique seu e-mail para ativar sua conta.',
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);

    if (
      !user ||
      !user.emailTokenExpiresAt ||
      user.emailTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Token de verificação inválido ou expirado.',
      );
    }

    await this.usersService.verifyUser(user.id);

    return { message: 'E-mail verificado com sucesso!' };
  }

  // --- FLUXO DE AUTENTICAÇÃO ---

  async login(
    dto: LoginUserDto,
    connectionInfo: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase());

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Por favor, verifique seu e-mail antes de logar.',
      );
    }

    const { accessToken, refreshToken, sessionId } = await this.generateTokens(
      user.id,
    );
    await this.updateUserSession(
      user.id,
      refreshToken,
      sessionId,
      connectionInfo,
    );

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { accessToken, refreshToken, user: userWithoutPassword };
  }

  async refresh(userId: string, sessionId: string, refreshToken: string) {
    const session = await this.prisma.session.findFirstOrThrow({
      where: { id: sessionId, userId },
    });

    const isMatch = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );
    if (!isMatch) throw new UnauthorizedException('Sessão expirada.');

    const tokens = await this.generateTokens(userId, sessionId);
    await this.updateUserSession(userId, tokens.refreshToken, sessionId);

    return tokens;
  }

  // --- GESTÃO DE SESSÕES ---

  async logout(sessionId: string) {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
    return { message: 'Deslogado com sucesso.' };
  }

  async logoutAll(userId: string) {
    await this.usersService.deleteAllUserSessions(userId);
    return { message: 'Todas as sessões foram encerradas.' };
  }

  async getActiveSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      select: { id: true, ipAddress: true, userAgent: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- MÉTODOS PRIVADOS (AUXILIARES) ---

  private async generateTokens(userId: string, sessionId?: string) {
    const newSessionId = sessionId || crypto.randomUUID();
    const payload = { sub: userId, sessionId: newSessionId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_EXPIRATION'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_REFRESH_EXPIRATION',
        ),
      }),
    ]);
    return { accessToken, refreshToken, sessionId: newSessionId };
  }

  private async updateUserSession(
    userId: string,
    refreshToken: string,
    sessionId: string,
    connectionInfo?: { ipAddress?: string; userAgent?: string },
  ) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const daysToExpire =
      this.configService.get<number>('SESSION_EXPIRES_DAYS') || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToExpire);

    await this.prisma.session.upsert({
      where: { id: sessionId },
      update: { refreshTokenHash, expiresAt, ...connectionInfo },
      create: {
        id: sessionId,
        userId,
        refreshTokenHash,
        expiresAt,
        ...connectionInfo,
      },
    });
  }

  async resendVerificationEmail(dto: ResendVerificationDto) {
    const email = dto.email.toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message:
          'Se um usuário com este e-mail existir, um novo link de verificação foi enviado.',
      };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Este e-mail já foi verificado.');
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    await this.usersService.updateVerificationToken(
      user.id,
      newToken,
      expiresAt,
    );

    await this.emailService.sendNewVerificationLink(
      user.name,
      user.email,
      newToken,
    );

    return {
      message:
        'Se um usuário com este e-mail existir, um novo link de verificação foi enviado.',
    };
  }
}
