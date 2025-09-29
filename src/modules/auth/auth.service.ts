import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Session } from '@prisma/client';
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

  async register(registerUserDto: RegisterUserDto) {
    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(registerUserDto.password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 3600000);

    try {
      const user = await this.usersService.createUser({
        name: registerUserDto.name,
        email: registerUserDto.email.toLocaleLowerCase(),
        username: registerUserDto.username,
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
          'Registro realizado com sucesso! Verifique seu e-mail para ativar sua conta.',
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email ou nome de usuário já existe.');
      }
      throw error;
    }
  }

  async login(
    loginUserDto: LoginUserDto,
    connectionInfo: { ipAddress?: string; userAgent?: string },
  ) {
    const lowerCaseEmail = loginUserDto.email.toLowerCase();
    const user = await this.usersService.findByEmail(lowerCaseEmail);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Seu e-mail ainda não foi verificado. Por favor, verifique sua caixa de entrada.',
      );
    }

    const isPasswordMatching = await bcrypt.compare(
      loginUserDto.password,
      user.passwordHash,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credenciais inválidas.');
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
    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  async refresh(userId: string, sessionId: string, refreshToken: string) {
    const session: Session = await this.prisma.session.findFirstOrThrow({
      where: { id: sessionId, userId },
    });

    const isMatch = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );
    if (!isMatch) throw new UnauthorizedException('Refresh token inválido.');

    const tokens = await this.generateTokens(userId, sessionId);
    await this.updateUserSession(userId, tokens.refreshToken, sessionId);

    return tokens;
  }

  async logout(sessionId: string) {
    this.logger.log(`Tentando deletar a sessão: ${sessionId}`);

    try {
      await this.usersService.deleteSession(sessionId);
      this.logger.log(
        { sessionId },
        'Sessão deslogada com sucesso do banco de dados.',
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          { sessionId },
          'Tentativa de logout para uma sessão que já não existe. Ação ignorada.',
        );
      } else {
        this.logger.error(
          { error: error instanceof Error ? error.message : String(error) },
          `Falha ao deletar a sessão ${sessionId}`,
        );
        throw error;
      }
    }

    return { message: 'Deslogado com sucesso.' };
  }

  async logoutAll(userId: string) {
    const { count } = await this.usersService.deleteAllUserSessions(userId);
    this.logger.log(
      { userId, count },
      `Todas as ${count} sessões do usuário foram encerradas.`,
    );
    return { message: 'Todas as suas sessões foram encerradas.' };
  }

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
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

    await this.prisma.session.upsert({
      where: { id: sessionId },
      update: {
        refreshTokenHash,
        expiresAt,
        ipAddress: connectionInfo?.ipAddress,
        userAgent: connectionInfo?.userAgent,
      },
      create: {
        id: sessionId,
        userId,
        refreshTokenHash,
        expiresAt,
        ipAddress: connectionInfo?.ipAddress,
        userAgent: connectionInfo?.userAgent,
      },
    });
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);

    if (!user || !user.emailTokenExpiresAt) {
      throw new BadRequestException('Token de verificação inválido.');
    }

    if (user.emailTokenExpiresAt < new Date()) {
      throw new BadRequestException('Token de verificação expirou.');
    }

    await this.usersService.verifyUser(user.id);

    return {
      message: 'E-mail verificado com sucesso! Você já pode fazer o login.',
    };
  }

  async resendVerificationEmail(resendDto: ResendVerificationDto) {
    const lowerCaseEmail = resendDto.email.toLowerCase();
    const user = await this.usersService.findByEmail(lowerCaseEmail);
    if (!user) {
      return {
        message:
          'Se um usuário com este e-mail existir, um novo link de verificação foi enviado.',
      };
    }
    if (user.emailVerified) {
      throw new BadRequestException('Este e-mail já foi verificado.');
    }
    const newVerificationToken = crypto.randomBytes(32).toString('hex');
    const newExpiresAt = new Date(Date.now() + 3600000);
    await this.usersService.updateVerificationToken(
      user.id,
      newVerificationToken,
      newExpiresAt,
    );
    await this.emailService.sendNewVerificationLink(
      user.name,
      user.email,
      newVerificationToken,
    );
    return {
      message:
        'Se um usuário com este e-mail existir, um novo link de verificação foi enviado.',
    };
  }

  async getActiveSessions(userId: string) {
    this.logger.debug(
      { userId },
      'Buscando sessões para este usuário no AuthService',
    );
    return this.prisma.session.findMany({
      where: { userId: userId },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
