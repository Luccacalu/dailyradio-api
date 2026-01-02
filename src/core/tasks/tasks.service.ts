import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanupUnverifiedUsers() {
    this.logger.log('Iniciando limpeza de usuários não verificados...');

    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);

    const { count } = await this.prisma.user.deleteMany({
      where: {
        emailVerified: false,
        createdAt: { lt: dayAgo },
      },
    });

    if (count > 0) {
      this.logger.log(`${count} usuário(s) não verificado(s) removidos.`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handleCleanupExpiredSessions() {
    this.logger.log('Iniciando limpeza de sessões expiradas...');

    const { count } = await this.prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (count > 0) {
      this.logger.log(`${count} sessão(ões) expirada(s) removida(s).`);
    }
  }
}
