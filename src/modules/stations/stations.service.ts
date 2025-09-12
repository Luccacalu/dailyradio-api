import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { CreateStationDto, StationModeDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/core/database/prisma.service';
import { JoinStationDto } from './dto/join-station.dto';

@Injectable()
export class StationsService {
  private readonly logger = new Logger(StationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createStationDto: CreateStationDto, creatorId: string) {
    if (createStationDto.mode === StationModeDto.FREEFLOW) {
      if (
        !createStationDto.maxSongsPerUserPerSet ||
        !createStationDto.votingThresholdPercent
      ) {
        throw new BadRequestException(
          'Para o modo Freeflow, é necessário definir o máximo de músicas e a % de votos.',
        );
      }
    } else if (createStationDto.mode === StationModeDto.BACKSTAGE) {
      if (!createStationDto.reviewsNeededToPost) {
        throw new BadRequestException(
          'Para o modo Backstage, é necessário definir o número de reviews para postar.',
        );
      }
    }

    let passwordHash: string | null = null;
    if (createStationDto.password) {
      passwordHash = await bcrypt.hash(createStationDto.password, 10);
    }

    return this.prisma.$transaction(async (tx) => {
      const station = await tx.station.create({
        data: {
          name: createStationDto.name,
          description: createStationDto.description,
          passwordHash,
          creatorId,
        },
      });

      await tx.stationMember.create({
        data: {
          stationId: station.id,
          userId: creatorId,
          role: 'ADMIN',
        },
      });

      this.logger.log(
        `Estação "${station.name}" (ID: ${station.id}) criada pelo usuário ${creatorId}`,
      );

      return station;
    });
  }

  findAll() {
    return this.prisma.station.findMany({
      where: { passwordHash: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.station.findUniqueOrThrow({
      where: { id },
      include: {
        members: {
          select: {
            joinedAt: true,
            role: true,
            user: {
              select: {
                id: true,
                username: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, updateStationDto: UpdateStationDto, userId: string) {
    const membership = await this.prisma.stationMember.findUniqueOrThrow({
      where: { userId_stationId: { userId, stationId: id } },
    });

    if (membership.role !== 'ADMIN' && membership.role !== 'MODERATOR') {
      throw new ForbiddenException(
        'Acesso negado. Apenas admins ou moderadores podem editar a estação.',
      );
    }

    if (updateStationDto.password) {
      updateStationDto.password = await bcrypt.hash(
        updateStationDto.password,
        10,
      );
    }

    return this.prisma.station.update({
      where: { id },
      data: updateStationDto,
    });
  }

  async remove(id: string, userId: string) {
    const station = await this.prisma.station.findUniqueOrThrow({
      where: { id },
    });

    if (station.creatorId !== userId) {
      throw new ForbiddenException(
        'Acesso negado. Apenas o criador pode deletar a estação.',
      );
    }

    return this.prisma.station.delete({ where: { id } });
  }

  async join(
    stationId: string,
    userId: string,
    joinStationDto: JoinStationDto,
  ): Promise<{ message: string }> {
    const station = await this.prisma.station.findUniqueOrThrow({
      where: { id: stationId },
    });

    const existingMembership = await this.prisma.stationMember.findUnique({
      where: { userId_stationId: { userId, stationId } },
    });

    if (existingMembership) {
      throw new ConflictException('Você já é um membro desta estação.');
    }

    if (station.passwordHash) {
      if (!joinStationDto.password) {
        throw new BadRequestException(
          'Esta estação é privada. Uma senha é necessária.',
        );
      }

      const isPasswordMatching = await bcrypt.compare(
        joinStationDto.password,
        station.passwordHash,
      );

      if (!isPasswordMatching) {
        throw new UnauthorizedException('Senha da estação incorreta.');
      }
    }

    await this.prisma.stationMember.create({
      data: {
        stationId,
        userId,
        role: 'MEMBER',
      },
    });

    this.logger.log(`Usuário ${userId} entrou na estação ${stationId}`);

    return { message: 'Você entrou na estação com sucesso.' };
  }

  async leave(stationId: string, userId: string) {
    const membership = await this.prisma.stationMember
      .findFirstOrThrow({
        where: { userId, stationId },
      })
      .catch(() => {
        throw new NotFoundException('Você não é membro desta estação.');
      });

    if (membership.role === 'ADMIN') {
      const adminCount = await this.prisma.stationMember.count({
        where: {
          stationId,
          role: 'ADMIN',
        },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException(
          'Você é o último administrador e não pode sair. Promova outro membro a administrador antes de sair.',
        );
      }
    }

    await this.prisma.stationMember.delete({
      where: {
        userId_stationId: {
          userId,
          stationId,
        },
      },
    });

    this.logger.log(`Usuário ${userId} saiu da estação ${stationId}`);

    return { message: 'Você saiu da estação com sucesso.' };
  }
}
