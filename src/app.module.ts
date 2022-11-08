import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FilesModule } from './files/files.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { TempStorageModule } from './temp-storage/temp-storage.module';
import { TokenFilesModule } from './token-files/token-files.module';
import { UtilsModule } from './utils/utils.module';

@Module({
  imports: [FilesModule, ConfigModule.forRoot({ isGlobal: true }), UsersModule, AuthModule, AdminModule, TempStorageModule, TokenFilesModule, UtilsModule],
  controllers: [AppController],
  providers: [AppService, ConfigService, PrismaService]
})
export class AppModule {}
