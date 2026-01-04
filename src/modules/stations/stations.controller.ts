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
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { GetCurrentUser } from '../../shared/decorators/get-current-user.decorator';
import { JoinStationDto } from './dto/join-station.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard';

@ApiTags('stations')
@ApiCookieAuth('access_token')
@UseGuards(AccessTokenGuard)
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova estação' })
  create(
    @Body() createStationDto: CreateStationDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.stationsService.create(createStationDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as estações públicas' })
  findAll() {
    return this.stationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma estação pelo ID' })
  findOne(@Param('id') id: string) {
    return this.stationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma estação' })
  update(
    @Param('id') id: string,
    @Body() updateStationDto: UpdateStationDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.stationsService.update(id, updateStationDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deleta uma estação' })
  remove(@Param('id') id: string, @GetCurrentUser('id') userId: string) {
    return this.stationsService.remove(id, userId);
  }

  @Post(':id/join')
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
    @GetCurrentUser('id') userId: string,
    @Body() joinStationDto: JoinStationDto,
  ) {
    return this.stationsService.join(stationId, userId, joinStationDto);
  }

  @Delete(':id/leave')
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
  leave(@Param('id') stationId: string, @GetCurrentUser('id') userId: string) {
    return this.stationsService.leave(stationId, userId);
  }

  @Get(':id/sets')
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
  findAllSets(
    @Param('id') stationId: string,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.stationsService.findAllSets(stationId, userId);
  }

  @Patch(':stationId/members/:memberId')
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
    @GetCurrentUser('id') userId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.stationsService.updateMemberRole(
      stationId,
      memberId,
      userId,
      updateMemberRoleDto,
    );
  }
}
