import {
  Injectable,
  Logger,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { StationRole, Set } from '@prisma/client';

@Injectable()
export class SetsService {
  private readonly logger = new Logger(SetsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findOne(setId: string, userId: string): Promise<Set> {
    const set = await this.prisma.set.findUniqueOrThrow({
      where: { id: setId },
    });

    await this.prisma.stationMember
      .findFirstOrThrow({
        where: { userId, stationId: set.stationId },
      })
      .catch(() => {
        throw new ForbiddenException(
          'Acesso negado. Você não é membro desta estação.',
        );
      });

    return this.prisma.set.findUniqueOrThrow({
      where: { id: setId },
      include: {
        submissions: {
          orderBy: [{ submitter: { username: 'asc' } }, { createdAt: 'asc' }],
          include: {
            submitter: { select: { id: true, username: true, imageUrl: true } },
          },
        },
      },
    });
  }

  async addSubmission(
    setId: string,
    userId: string,
    createSubmissionDto: CreateSubmissionDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const set = await tx.set.findUniqueOrThrow({
        where: { id: setId },
        include: { station: true },
      });

      if (set.status !== 'ACTIVE' && set.status !== 'FINISHED_AND_OPEN') {
        throw new ForbiddenException(
          'Este set não está aberto para novas submissões.',
        );
      }

      await tx.stationMember
        .findFirstOrThrow({
          where: { userId, stationId: set.stationId },
        })
        .catch(() => {
          throw new ForbiddenException(
            'Acesso negado. Você não é membro desta estação.',
          );
        });

      if (set.station.maxSongsPerUserPerSet) {
        const submissionCount = await tx.musicSubmission.count({
          where: { setId, submitterId: userId },
        });
        if (submissionCount >= set.station.maxSongsPerUserPerSet) {
          throw new ForbiddenException(
            'Você já atingiu o limite de músicas para este set.',
          );
        }
      }

      const submission = await tx.musicSubmission.create({
        data: {
          ...createSubmissionDto,
          setId,
          submitterId: userId,
        },
      });

      this.logger.log(
        `Nova música submetida (ID: ${submission.id}) no set ${setId} pelo usuário ${userId}`,
      );
      return submission;
    });
  }

  async voteToEnd(setId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const currentSet = await tx.set.findUniqueOrThrow({
        where: { id: setId },
        include: { station: true },
      });

      if (currentSet.status === 'FINISHED') {
        throw new ForbiddenException('Este set não está mais ativo.');
      }

      await tx.stationMember
        .findFirstOrThrow({
          where: { userId, stationId: currentSet.stationId },
        })
        .catch(() => {
          throw new ForbiddenException(
            'Acesso negado. Você não é membro desta estação.',
          );
        });

      const existingVote = await tx.setReadyVote.findUnique({
        where: { userId_setId: { userId, setId } },
      });
      if (existingVote) {
        throw new ConflictException('Você já votou para finalizar este set.');
      }

      await tx.setReadyVote.create({ data: { setId, userId } });

      const voteCount = await tx.setReadyVote.count({ where: { setId } });
      const memberCount = await tx.stationMember.count({
        where: { stationId: currentSet.stationId },
      });
      const threshold = currentSet.station.votingThresholdPercent ?? 100;
      const currentPercent = (voteCount / memberCount) * 100;

      if (currentPercent >= threshold) {
        await tx.set.update({
          where: { id: setId },
          data: { status: 'FINISHED' },
        });
        const nextSet = await tx.set.create({
          data: {
            stationId: currentSet.stationId,
            setNumber: currentSet.setNumber + 1,
            status: 'ACTIVE',
          },
        });
        this.logger.log(
          `Set ${setId} finalizado. Novo set ${nextSet.id} criado para a estação ${currentSet.stationId}.`,
        );
        return {
          message: `Set finalizado! Bem-vindo ao Set ${nextSet.setNumber}.`,
          nextSet,
        };
      }

      this.logger.log(
        `Voto para finalizar o set ${setId} registrado pelo usuário ${userId}.`,
      );
      return { message: 'Seu voto para finalizar o set foi registrado.' };
    });
  }

  async reopenSet(setId: string, userId: string) {
    const set = await this.prisma.set.findUniqueOrThrow({
      where: { id: setId },
    });

    const membership = await this.prisma.stationMember
      .findUniqueOrThrow({
        where: { userId_stationId: { userId, stationId: set.stationId } },
      })
      .catch(() => {
        throw new ForbiddenException('Acesso negado.');
      });

    if (
      membership.role !== StationRole.ADMIN &&
      membership.role !== StationRole.MODERATOR
    ) {
      throw new ForbiddenException(
        'Apenas administradores ou moderadores podem reabrir um set.',
      );
    }

    if (set.status !== 'FINISHED') {
      throw new ConflictException(
        'Apenas sets com status "FINISHED" podem ser reabertos.',
      );
    }

    const updatedSet = await this.prisma.set.update({
      where: { id: setId },
      data: {
        status: 'FINISHED_AND_OPEN',
      },
    });

    this.logger.log(`Set ${setId} foi reaberto pelo usuário ${userId}`);

    return updatedSet;
  }

  async closeSet(setId: string, userId: string) {
    const set = await this.prisma.set.findUniqueOrThrow({
      where: { id: setId },
    });

    const membership = await this.prisma.stationMember
      .findUniqueOrThrow({
        where: { userId_stationId: { userId, stationId: set.stationId } },
      })
      .catch(() => {
        throw new ForbiddenException('Acesso negado.');
      });

    if (
      membership.role !== StationRole.ADMIN &&
      membership.role !== StationRole.MODERATOR
    ) {
      throw new ForbiddenException(
        'Apenas administradores ou moderadores podem fechar um set.',
      );
    }

    if (set.status !== 'FINISHED_AND_OPEN') {
      throw new ConflictException(
        'Apenas sets com status "FINISHED_AND_OPEN" podem ser fechados.',
      );
    }

    const updatedSet = await this.prisma.set.update({
      where: { id: setId },
      data: {
        status: 'FINISHED',
      },
    });

    this.logger.log(
      `Set ${setId} foi fechado novamente pelo usuário ${userId}`,
    );

    return updatedSet;
  }
}
