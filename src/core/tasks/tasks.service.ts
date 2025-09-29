import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanupUnverifiedUsers() {
    this.logger.log('Iniciando limpeza de usuários não verificados...');

    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await this.prisma.user.deleteMany({
      where: {
        AND: [
          {
            emailVerified: false,
          },
          {
            createdAt: {
              lt: threshold,
            },
          },
        ],
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `${result.count} usuário(s) não verificado(s) foram deletados.`,
      );
    } else {
      this.logger.log('Nenhum usuário não verificado para limpar.');
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handleCleanupExpiredSessions() {
    this.logger.log('Iniciando limpeza de sessões expiradas...');

    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `${result.count} sessão(ões) expirada(s) foram deletadas.`,
      );
    } else {
      this.logger.log('Nenhuma sessão expirada para limpar.');
    }
  }
}
