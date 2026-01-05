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
    createReviewDto: CreateReviewDto,
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

    const { station } = submission.set;

    await this.validateMembership(authorId, station.id);
    this.validateStationRules(station, createReviewDto);

    return this.prisma.review.create({
      data: {
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
        submissionId,
        authorId,
        parentId: null,
      },
    });
  }

  async createReply(
    parentId: string,
    authorId: string,
    createReplyDto: CreateReplyDto,
  ) {
    const parentReview = await this.prisma.review.findUniqueOrThrow({
      where: { id: parentId },
      include: {
        submission: { include: { set: { include: { station: true } } } },
      },
    });

    const { submission } = parentReview;
    await this.validateMembership(authorId, submission.set.stationId);

    return this.prisma.review.create({
      data: {
        comment: createReplyDto.comment,
        submissionId: submission.id,
        authorId,
        parentId,
      },
    });
  }

  private async validateMembership(userId: string, stationId: string) {
    const isMember = await this.prisma.stationMember.findUnique({
      where: { userId_stationId: { userId, stationId } },
    });

    if (!isMember) {
      throw new ForbiddenException(
        'Apenas membros da estação podem interagir aqui.',
      );
    }
  }

  private validateStationRules(
    station: { ratingSystem: string; reviewSystem: string },
    dto: CreateReviewDto,
  ) {
    const { ratingSystem, reviewSystem } = station;

    if (ratingSystem === 'TRUE' && dto.rating === undefined) {
      throw new BadRequestException('A nota é obrigatória nesta estação.');
    }
    if (reviewSystem === 'TRUE' && !dto.comment) {
      throw new BadRequestException(
        'O comentário é obrigatório nesta estação.',
      );
    }

    if (ratingSystem === 'FALSE' && dto.rating !== undefined) {
      throw new BadRequestException(
        'Esta estação não permite notas, apenas comentários.',
      );
    }
    if (reviewSystem === 'FALSE' && dto.comment) {
      throw new BadRequestException(
        'Esta estação não permite comentários, apenas notas.',
      );
    }
  }
}
