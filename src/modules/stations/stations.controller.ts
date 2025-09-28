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
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { GetCurrentUser } from '../../shared/decorators/get-current-user.decorator';
import type { User } from '@prisma/client';
import { JoinStationDto } from './dto/join-station.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@ApiTags('stations')
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

  @Get(':id/sets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista todos os sets de uma estação (passados e atual)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de sets retornada com sucesso.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Usuário não é membro da estação.',
  })
  findAllSets(@Param('id') stationId: string, @GetCurrentUser() user: User) {
    return this.stationsService.findAllSets(stationId, user.id);
  }

  @Patch(':stationId/members/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Altera o cargo de um membro na estação (Admin Only)',
  })
  @ApiResponse({ status: 200, description: 'Cargo alterado com sucesso.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Requer cargo de Admin.',
  })
  @ApiResponse({
    status: 404,
    description: 'Estação ou membro não encontrado.',
  })
  updateMemberRole(
    @Param('stationId') stationId: string,
    @Param('memberId') memberId: string,
    @GetCurrentUser() user: User,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.stationsService.updateMemberRole(
      stationId,
      memberId,
      user.id,
      updateMemberRoleDto,
    );
  }
}
