import {
  Injectable,
  Logger,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { StationRole, Set } from '@prisma/client';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class SetsService {
  private readonly logger = new Logger(SetsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findOne(setId: string, userId: string): Promise<Set> {
    const set = await this.prisma.set.findUniqueOrThrow({
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

    await this.validateMembership(userId, set.stationId);

    return set;
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
        throw new ForbiddenException('Este set não aceita mais músicas.');
      }

      await this.validateMembership(userId, set.stationId, tx);

      if (set.station.maxSongsPerUserPerSet) {
        const submissionCount = await tx.musicSubmission.count({
          where: { setId, submitterId: userId },
        });
        if (submissionCount >= set.station.maxSongsPerUserPerSet) {
          throw new ForbiddenException(
            'Limite de músicas atingido para este set.',
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

      if (currentSet.status === 'FINISHED')
        throw new ConflictException('Set já finalizado.');
      await this.validateMembership(userId, currentSet.stationId, tx);

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
    await this.validateMembership(userId, set.stationId, this.prisma, [
      StationRole.ADMIN,
      StationRole.MODERATOR,
    ]);

    if (set.status !== 'FINISHED') {
      throw new BadRequestException(
        'Apenas sets finalizados podem ser reabertos.',
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
    await this.validateMembership(userId, set.stationId, this.prisma, [
      StationRole.ADMIN,
      StationRole.MODERATOR,
    ]);

    if (set.status !== 'FINISHED_AND_OPEN') {
      throw new BadRequestException(
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

  private async validateMembership(
    userId: string,
    stationId: string,
    tx: PrismaClient | Prisma.TransactionClient = this.prisma,
    roles?: StationRole[],
  ) {
    const member = await tx.stationMember.findUnique({
      where: { userId_stationId: { userId, stationId } },
    });

    if (!member)
      throw new ForbiddenException('Você não pertence a esta estação.');

    if (roles && !roles.includes(member.role)) {
      throw new ForbiddenException('Você não tem permissão para esta ação.');
    }

    return member;
  }
}
