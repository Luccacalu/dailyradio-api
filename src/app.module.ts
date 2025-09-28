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
import { HealthModule } from './modules/health/health.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { StationsModule } from './modules/stations/stations.module';
import { SetsModule } from './modules/sets/sets.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
    ScheduleModule.forRoot(),
    TasksModule,
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    AuthModule,
    UsersModule,
    PrismaModule,
    EmailModule,
    TasksModule,
    HealthModule,
    StationsModule,
    SetsModule,
    SubmissionsModule,
    ReviewsModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
