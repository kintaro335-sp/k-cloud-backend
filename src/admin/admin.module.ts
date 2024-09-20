/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
// external modules
import { FilesModule } from '../files/files.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { LogsModule } from '../logs/logs.module';
import { MonitorModule } from '../monitor/monitor.module';
import { SystemModule } from '../system/system.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [AuthModule, forwardRef(() => FilesModule), UsersModule, LogsModule, MonitorModule, SystemModule, SessionsModule],
  exports: [AdminService],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
