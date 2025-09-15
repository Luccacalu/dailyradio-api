import { Module } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  imports: [ReviewsModule],
})
export class SubmissionsModule {}
