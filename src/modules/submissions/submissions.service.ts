import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  findReviews(submissionId: string) {
    return this.prisma.review.findMany({
      where: {
        submissionId,
        parentId: null,
      },
      include: {
        author: { select: { id: true, username: true, imageUrl: true } },
        replies: {
          include: {
            author: { select: { id: true, username: true, imageUrl: true } },
            _count: {
              select: { replies: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
