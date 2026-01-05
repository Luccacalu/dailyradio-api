import { Body, Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { ReviewsService } from '../reviews/reviews.service';
import { GetCurrentUser } from 'src/shared/decorators/get-current-user.decorator';
import { CreateReviewDto } from '../reviews/dto/create-review.dto';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard';

@ApiTags('submissions')
@ApiCookieAuth('access_token')
@UseGuards(AccessTokenGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Get(':id/reviews')
  @ApiOperation({
    summary: 'Busca as reviews de uma submissão de música específica',
  })
  findReviews(@Param('id') id: string) {
    return this.submissionsService.findReviews(id);
  }

  @Post(':id/reviews')
  @ApiOperation({ summary: 'Cria uma nova review para uma música' })
  createReview(
    @Param('id') submissionId: string,
    @GetCurrentUser('id') userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.createRootReview(
      submissionId,
      userId,
      createReviewDto,
    );
  }
}
