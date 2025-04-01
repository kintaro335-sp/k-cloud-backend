/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FilesModule } from './files/files.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { TempStorageModule } from './temp-storage/temp-storage.module';
import { TokenFilesModule } from './token-files/token-files.module';
import { UtilsModule } from './utils/utils.module';
import { SharedFileModule } from './shared-file/shared-file.module';
import { SetupModule } from './setup/setup.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './auth/constants';
import { WebSocketModule } from './websockets/websocket.module';
import { SessionsModule } from './sessions/sessions.module';
import { MonitorModule } from './monitor/monitor.module';
import { LogsModule } from './logs/logs.module';
import { PrismaModule } from './prisma.module';
// middlewares
import { LoggerMiddleware } from './middlewares/logger.middleware';

const serveStaticDir = process.env.SERVE_CLIENT;
const serveStatic = Boolean(process.env.SERVE_CLIENT);

function loadSerStaticModule() {
  if (!serveStatic) return [];
  return [ServeStaticModule.forRoot({ rootPath: serveStaticDir })];
}

@Module({
  imports: [
    ...loadSerStaticModule(),
    PrismaModule,
    FilesModule,
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: {},
      global: true,
      verifyOptions: { algorithms: ['HS256'] }
    }),
    SessionsModule,
    UsersModule,
    AuthModule,
    AdminModule,
    TempStorageModule,
    TokenFilesModule,
    UtilsModule,
    ScheduleModule.forRoot(),
    SharedFileModule,
    SetupModule,
    LogsModule,
    MonitorModule,
    WebSocketModule
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('/shared-file/*path');
  }
}
