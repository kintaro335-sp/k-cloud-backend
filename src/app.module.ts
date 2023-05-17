import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
import { SharedFileModule } from './shared-file/shared-file.module';
import { SetupModule } from './setup/setup.module';
// middlewares
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    FilesModule,
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    AdminModule,
    TempStorageModule,
    TokenFilesModule,
    UtilsModule,
    ScheduleModule.forRoot(),
    SharedFileModule,
    SetupModule,
    LogsModule
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService, PrismaService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
