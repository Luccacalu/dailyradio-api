// src/modules/users/users.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetCurrentUser } from '../../shared/decorators/get-current-user.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import type { User } from '@prisma/client';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtém os dados do usuário logado' })
  @ApiResponse({ status: 200, description: 'Retorna os dados do usuário.' })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado. Token inválido ou ausente.',
  })
  getMe(@GetCurrentUser() user: User) {
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Get('me/stations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna as estações do usuário logado' })
  getMyStations(@GetCurrentUser() user: User) {
    return this.usersService.findUserStations(user.id);
  }
}
