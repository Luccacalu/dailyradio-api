import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../../core/email/email.module';
import { PassportModule } from '@nestjs/passport';
import { AccessTokenStrategy } from './access-token.strategy';
import { RefreshTokenStrategy } from './refresh-token.strategy';

@Module({
  imports: [
    UsersModule,
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule.forRoot(),
    JwtModule.register({}),
    /* JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
        },
      }),
    }), */
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy],
})
export class AuthModule {}
