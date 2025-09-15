import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReplyDto } from './dto/create-reply.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  findReplies(reviewId: string) {
    return this.prisma.review.findMany({
      where: { parentId: reviewId },
      include: {
        author: { select: { id: true, username: true, imageUrl: true } },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createRootReview(
    submissionId: string,
    authorId: string,
    dto: CreateReviewDto,
  ) {
    const submission = await this.prisma.musicSubmission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { set: { include: { station: true } } },
    });

    if (submission.submitterId === authorId) {
      throw new ForbiddenException(
        'Você não pode avaliar sua própria submissão de música.',
      );
    }

    await this.prisma.stationMember
      .findFirstOrThrow({
        where: { userId: authorId, stationId: submission.set.stationId },
      })
      .catch(() => {
        throw new ForbiddenException(
          'Apenas membros da estação podem fazer reviews.',
        );
      });

    const { ratingSystem, reviewSystem } = submission.set.station;
    if (ratingSystem === 'TRUE' && !dto.rating) {
      throw new BadRequestException('Rating é obrigatório nesta estação.');
    }
    if (reviewSystem === 'TRUE' && !dto.comment) {
      throw new BadRequestException('Comentário é obrigatório nesta estação.');
    }
    if (ratingSystem === 'FALSE' && dto.rating) {
      throw new BadRequestException('Rating não é permitido nesta estação.');
    }
    if (reviewSystem === 'FALSE' && dto.comment) {
      throw new BadRequestException(
        'Comentário não é permitido nesta estação.',
      );
    }

    return this.prisma.review.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        submissionId,
        authorId,
        parentId: null,
      },
    });
  }

  async createReply(parentId: string, authorId: string, dto: CreateReplyDto) {
    const parentReview = await this.prisma.review.findUniqueOrThrow({
      where: { id: parentId },
      include: {
        submission: { include: { set: { include: { station: true } } } },
      },
    });

    const { submission } = parentReview;
    const { station } = submission.set;

    await this.prisma.stationMember
      .findFirstOrThrow({
        where: { userId: authorId, stationId: station.id },
      })
      .catch(() => {
        throw new ForbiddenException(
          'Apenas membros da estação podem responder a reviews.',
        );
      });

    return this.prisma.review.create({
      data: {
        comment: dto.comment,
        submissionId: submission.id,
        authorId,
        parentId,
      },
    });
  }
}
