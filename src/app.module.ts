import { Module } from '@nestjs/common';
import { PrismaService } from './core/database/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './core/database/prisma.module';

@Module({
  imports: [AuthModule, UsersModule, PrismaModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
