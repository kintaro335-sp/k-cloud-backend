import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CryptoModule } from './crypto/crypto.module';

@Module({
  imports: [FilesModule, ConfigModule.forRoot({ isGlobal: true }), AuthModule, UsersModule, CryptoModule],
  controllers: [AppController],
  providers: [AppService, ConfigService]
})
export class AppModule {}
