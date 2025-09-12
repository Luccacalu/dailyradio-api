import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StationsService } from './stations.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiSecurity,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { GetCurrentUser } from '../../shared/decorators/get-current-user.decorator';
import type { User } from '@prisma/client';
import { JoinStationDto } from './dto/join-station.dto';

@ApiTags('stations')
@ApiSecurity('apiKey')
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria uma nova estação' })
  create(
    @Body() createStationDto: CreateStationDto,
    @GetCurrentUser() user: User,
  ) {
    return this.stationsService.create(createStationDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as estações públicas' })
  findAll() {
    return this.stationsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca uma estação pelo ID' })
  findOne(@Param('id') id: string) {
    return this.stationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza uma estação' })
  update(
    @Param('id') id: string,
    @Body() updateStationDto: UpdateStationDto,
    @GetCurrentUser() user: User,
  ) {
    return this.stationsService.update(id, updateStationDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deleta uma estação' })
  remove(@Param('id') id: string, @GetCurrentUser() user: User) {
    return this.stationsService.remove(id, user.id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Entra em uma estação' })
  @ApiResponse({
    status: 200,
    description: 'Usuário entrou na estação com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Senha incorreta para estação privada.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário já é membro desta estação.',
  })
  join(
    @Param('id') stationId: string,
    @GetCurrentUser() user: User,
    @Body() joinStationDto: JoinStationDto,
  ) {
    return this.stationsService.join(stationId, user.id, joinStationDto);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sai de uma estação' })
  @ApiResponse({
    status: 200,
    description: 'Usuário saiu da estação com sucesso.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado (ex: último admin tentando sair).',
  })
  @ApiResponse({
    status: 404,
    description: 'Estação não encontrada ou usuário não é membro.',
  })
  leave(@Param('id') stationId: string, @GetCurrentUser() user: User) {
    return this.stationsService.leave(stationId, user.id);
  }
}
