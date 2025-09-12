import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../../core/email/email.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);
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

  async login(loginUserDto: LoginUserDto) {
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

    const payload = { sub: user.id, username: user.username };
    const accessToken = await this.jwtService.signAsync(payload);
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      access_token: accessToken,
      user: userWithoutPassword,
    };
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
}
