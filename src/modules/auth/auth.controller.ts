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
  ApiCookieAuth,
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

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registra um novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Registro realizado. Verifique seu e-mail.',
  })
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realiza login e define cookies de sessão' })
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.login(
      dto,
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    );

    res.cookie('access_token', accessToken, COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);

    return { user };
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renova o access token' })
  async refresh(
    @getRefreshTokenPayloadDecorator.GetRefreshTokenPayload()
    payload: getRefreshTokenPayloadDecorator.RefreshTokenPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken } = await this.authService.refresh(
      payload.sub,
      payload.sessionId,
      payload.refreshToken,
    );

    res.cookie('access_token', accessToken, COOKIE_OPTIONS);
    return { message: 'Token renovado.' };
  }

  @Post('logout')
  @UseGuards(AccessTokenGuard)
  @ApiCookieAuth('access_token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encerra a sessão atual' })
  async logout(
    @GetCurrentSessionId() sessionId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(sessionId);
    this.clearAuthCookies(res);
    return { message: 'Deslogado com sucesso.' };
  }

  @Post('logout-all')
  @UseGuards(AccessTokenGuard)
  @ApiCookieAuth('access_token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encerra TODAS as sessões do usuário' })
  async logoutAll(
    @GetCurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.id);
    this.clearAuthCookies(res);
    return { message: 'Todas as sessões foram encerradas.' };
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Valida o token de e-mail' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenvia link de ativação' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto);
  }

  @Get('sessions')
  @UseGuards(AccessTokenGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Lista sessões ativas do usuário' })
  @ApiResponse({ type: [SessionDto] })
  async getSessions(
    @GetCurrentUser() user: User,
    @GetCurrentSessionId() sessionId: string,
  ): Promise<SessionDto[]> {
    const sessions = await this.authService.getActiveSessions(user.id);

    return sessions.map((s) => ({
      ...s,
      isCurrent: s.id === sessionId,
    }));
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token', COOKIE_OPTIONS);
    res.clearCookie('refresh_token', COOKIE_OPTIONS);
  }
}
