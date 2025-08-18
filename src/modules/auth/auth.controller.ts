import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@ApiTags('auth')
@ApiSecurity('apiKey')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registra um novo usuário' })
  @ApiResponse({
    status: 201,
    description:
      'Usuário registrado com sucesso. Retorna os dados do usuário (sem a senha).',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflito. O e-mail ou nome de usuário já existe.',
  })
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica um usuário e retorna um token JWT' })
  @ApiResponse({
    status: 200,
    description: 'Login bem-sucedido. Retorna o token de acesso.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verifica o e-mail de um usuário usando um token' })
  @ApiResponse({ status: 200, description: 'E-mail verificado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado.' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenvia o e-mail de verificação' })
  @ApiResponse({
    status: 200,
    description: 'Confirmação de que o e-mail foi processado.',
  })
  @ApiResponse({ status: 400, description: 'O e-mail já foi verificado.' })
  resendVerificationEmail(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(resendDto);
  }
}
