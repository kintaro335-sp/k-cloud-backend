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
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '7d' },
    }),
    CryptoModule,
    FilesModule
  ],
  exports: [AuthService],
  providers: [AuthService, JwtStrategyHeader, JwtStrategyQuery],
  controllers: [AuthController]
})
export class AuthModule {}
