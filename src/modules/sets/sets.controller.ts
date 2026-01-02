import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { SetsService } from './sets.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { GetCurrentUser } from '../../shared/decorators/get-current-user.decorator';
import type { User } from '@prisma/client';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@ApiTags('sets')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('access_token')
@Controller('sets')
export class SetsController {
  constructor(private readonly setsService: SetsService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Busca um set pelo ID com todas as suas músicas e reviews',
  })
  findOne(@Param('id') id: string, @GetCurrentUser() user: User) {
    return this.setsService.findOne(id, user.id);
  }

  @Post(':id/submissions')
  @ApiOperation({ summary: 'Adiciona uma nova música a um set' })
  addSubmission(
    @Param('id') id: string,
    @GetCurrentUser() user: User,
    @Body() createSubmissionDto: CreateSubmissionDto,
  ) {
    return this.setsService.addSubmission(id, user.id, createSubmissionDto);
  }

  @Post(':id/ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vota para finalizar o set atual' })
  voteToEnd(@Param('id') id: string, @GetCurrentUser() user: User) {
    return this.setsService.voteToEnd(id, user.id);
  }

  @Patch(':id/reopen')
  @ApiOperation({
    summary: 'Reabre um set finalizado para novas submissões (Admin/Mod Only)',
  })
  @ApiResponse({ status: 200, description: 'Set reaberto com sucesso.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas para admins/moderadores.',
  })
  @ApiResponse({
    status: 409,
    description: 'O set não está no estado "FINISHED".',
  })
  reopenSet(@Param('id') id: string, @GetCurrentUser() user: User) {
    return this.setsService.reopenSet(id, user.id);
  }

  @Patch(':id/close')
  @ApiOperation({
    summary: 'Fecha um set que estava reaberto (Admin/Mod Only)',
  })
  @ApiResponse({ status: 200, description: 'Set fechado com sucesso.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas para admins/moderadores.',
  })
  @ApiResponse({
    status: 409,
    description: 'O set não está no estado "FINISHED_AND_OPEN".',
  })
  closeSet(@Param('id') id: string, @GetCurrentUser() user: User) {
    return this.setsService.closeSet(id, user.id);
  }
}
