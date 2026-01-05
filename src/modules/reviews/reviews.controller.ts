import { Controller, Get, Post, Param, UseGuards, Body } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { GetCurrentUser } from 'src/shared/decorators/get-current-user.decorator';
import { CreateReplyDto } from './dto/create-reply.dto';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard';

@ApiTags('reviews')
@ApiCookieAuth('access_token')
@UseGuards(AccessTokenGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':id/replies')
  @ApiOperation({
    summary: 'Busca as respostas (thread) de uma review específica',
  })
  findReplies(@Param('id') id: string) {
    return this.reviewsService.findReplies(id);
  }

  @Post(':id/replies')
  @ApiOperation({ summary: 'Responde a uma review existente' })
  createReply(
    @Param('id') parentId: string,
    @GetCurrentUser('id') userId: string,
    @Body() createReplyDto: CreateReplyDto,
  ) {
    return this.reviewsService.createReply(parentId, userId, createReplyDto);
  }
}
