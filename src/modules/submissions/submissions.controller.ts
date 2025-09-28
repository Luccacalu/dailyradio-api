import { Body, Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { ReviewsService } from '../reviews/reviews.service';
import type { User } from '@prisma/client';
import { GetCurrentUser } from 'src/shared/decorators/get-current-user.decorator';
import { CreateReviewDto } from '../reviews/dto/create-review.dto';

@ApiTags('submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Get(':id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Busca as reviews de uma submissão de música específica',
  })
  findReviews(@Param('id') id: string) {
    return this.submissionsService.findReviews(id);
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria uma nova review para uma música' })
  createReview(
    @Param('id') submissionId: string,
    @GetCurrentUser() user: User,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.createRootReview(
      submissionId,
      user.id,
      createReviewDto,
    );
  }
}
