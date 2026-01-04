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
import { GetCurrentUser } from '../../shared/decorators/get-current-user.decorator';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard';

@ApiTags('sets')
@UseGuards(AccessTokenGuard)
@ApiCookieAuth('access_token')
@Controller('sets')
export class SetsController {
  constructor(private readonly setsService: SetsService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Busca um set pelo ID com todas as suas músicas e reviews',
  })
  findOne(@Param('id') id: string, @GetCurrentUser('id') userId: string) {
    return this.setsService.findOne(id, userId);
  }

  @Post(':id/submissions')
  @ApiOperation({ summary: 'Adiciona uma nova música a um set' })
  addSubmission(
    @Param('id') id: string,
    @GetCurrentUser('id') userId: string,
    @Body() createSubmissionDto: CreateSubmissionDto,
  ) {
    return this.setsService.addSubmission(id, userId, createSubmissionDto);
  }

  @Post(':id/ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vota para finalizar o set atual' })
  voteToEnd(@Param('id') id: string, @GetCurrentUser('id') userId: string) {
    return this.setsService.voteToEnd(id, userId);
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
  reopenSet(@Param('id') id: string, @GetCurrentUser('id') userId: string) {
    return this.setsService.reopenSet(id, userId);
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
  closeSet(@Param('id') id: string, @GetCurrentUser('id') userId: string) {
    return this.setsService.closeSet(id, userId);
  }
}
