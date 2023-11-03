import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { SystemModule } from '../system/system.module';
import { AuthController } from './auth.controller';
import { JwtStrategyHeader, JwtStrategyQuery } from './jwt.strategy';
import { CryptoModule } from '../crypto/crypto.module';
import { FilesModule } from '../files/files.module';
@Module({
  imports: [UsersModule, PassportModule, CryptoModule, forwardRef(() => FilesModule), SystemModule],
  exports: [AuthService],
  providers: [AuthService, JwtStrategyHeader, JwtStrategyQuery],
  controllers: [AuthController]
})
export class AuthModule {}
