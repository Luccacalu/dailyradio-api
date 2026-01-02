import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from '../../shared/decorators/get-current-user.decorator';
import { UsersService } from './users.service';
import type { User } from '@prisma/client';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(AccessTokenGuard)
@ApiCookieAuth('access_token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@GetCurrentUser() user: User) {
    return user;
  }

  @Patch('me')
  updateProfile(
    @GetCurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('me/stations')
  getMyStations(@GetCurrentUser('id') userId: string) {
    return this.usersService.findUserStations(userId);
  }
}
