import { Prisma } from '@prisma/client';
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);

    const lowerCaseEmail = registerUserDto.email.toLowerCase();

    try {
      const user = await this.usersService.createUser({
        name: registerUserDto.name,
        email: lowerCaseEmail,
        username: registerUserDto.username,
        passwordHash: hashedPassword,
      });

      const { passwordHash: _, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email ou nome de usuário já existe.');
        }
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

    const isPasswordMatching = await bcrypt.compare(
      loginUserDto.password,
      user.passwordHash,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const payload = { sub: user.id, username: user.username };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
    };
  }
}
