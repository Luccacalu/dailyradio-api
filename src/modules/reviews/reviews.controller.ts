import { Controller, Get, Post, Param, UseGuards, Body } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { GetCurrentUser } from 'src/shared/decorators/get-current-user.decorator';
import type { User } from '@prisma/client';
import { CreateReplyDto } from './dto/create-reply.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':id/replies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Busca as respostas (thread) de uma review específica',
  })
  findReplies(@Param('id') id: string) {
    return this.reviewsService.findReplies(id);
  }

  @Post(':id/replies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Responde a uma review existente' })
  createReply(
    @Param('id') parentId: string,
    @GetCurrentUser() user: User,
    @Body() createReplyDto: CreateReplyDto,
  ) {
    return this.reviewsService.createReply(parentId, user.id, createReplyDto);
  }
}
