import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { AuthController } from './auth.controller';
import { JwtStrategyHeader, JwtStrategyQuery } from './jwt.strategy';
import { CryptoModule } from '../crypto/crypto.module';
import { FilesModule } from '../files/files.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '30m' },
    }),
    CryptoModule,
    FilesModule
  ],
  providers: [AuthService, JwtStrategyHeader, JwtStrategyQuery],
  controllers: [AuthController]
})
export class AuthModule {}
