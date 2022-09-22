import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FilesModule } from './files/files.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma.service';
import { CryptoModule } from './crypto/crypto.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [FilesModule, ConfigModule.forRoot({ isGlobal: true }), UsersModule, AuthModule, AdminModule],
  controllers: [AppController],
  providers: [AppService, ConfigService, PrismaService]
})
export class AppModule {}
