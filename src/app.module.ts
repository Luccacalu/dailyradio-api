import { Module } from '@nestjs/common';
import { PrismaService } from './core/database/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './core/database/prisma.module';
import { EmailModule } from './core/email/email.module';
import { ConfigModule } from '@nestjs/config';
import { TasksModule } from './core/tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { validationSchema } from './config/app.config';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './shared/guards/api-key.guard';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TasksModule,
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    AuthModule,
    UsersModule,
    PrismaModule,
    EmailModule,
    TasksModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
