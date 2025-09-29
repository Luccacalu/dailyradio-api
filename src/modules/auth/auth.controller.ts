import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import type { Response, Request } from 'express';
import type { User } from '@prisma/client';
import { GetCurrentUser } from 'src/shared/decorators/get-current-user.decorator';
import { AccessTokenGuard } from '../../shared/guards/access-token.guard';
import { RefreshTokenGuard } from '../../shared/guards/refresh-token.guard';
import * as getRefreshTokenPayloadDecorator from 'src/shared/decorators/get-refresh-token-payload.decorator';
import { GetCurrentSessionId } from 'src/shared/decorators/get-current-session-id.decorator';
import { SessionDto } from './dto/session.dto';

@ApiTags('auth')
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
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const connectionInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const { accessToken, refreshToken, user } = await this.authService.login(
      loginUserDto,
      connectionInfo,
    );

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return { user };
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza o access token usando o refresh token' })
  @ApiBearerAuth('jwt-refresh')
  async refresh(
    @getRefreshTokenPayloadDecorator.GetRefreshTokenPayload()
    payload: getRefreshTokenPayloadDecorator.RefreshTokenPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken: newAccessToken } = await this.authService.refresh(
      payload.sub,
      payload.sessionId,
      payload.refreshToken,
    );

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return { message: 'Token atualizado com sucesso.' };
  }

  @Post('logout')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desloga a sessão atual' })
  async logout(
    @GetCurrentSessionId() sessionId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(sessionId);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return { message: 'Deslogado com sucesso.' };
  }

  @Post('logout-all')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @GetCurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.id);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { message: 'Todas as suas sessões foram encerradas.' };
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

  @Get('sessions')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todas as sessões ativas do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de sessões ativas retornada com sucesso.',
    type: [SessionDto],
  })
  async getSessions(
    @GetCurrentUser() user: User,
    @GetCurrentSessionId() sessionId: string,
  ): Promise<SessionDto[]> {
    console.log('--- Auth Controller ---');
    console.log('Usuário recebido pelo decorador:', user.id, user.username);
    const sessions = await this.authService.getActiveSessions(user.id);

    return sessions.map((session) => ({
      ...session,
      isCurrent: session.id === sessionId,
    }));
  }
}
