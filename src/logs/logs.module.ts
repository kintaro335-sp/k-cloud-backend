/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
// services
import { LogsService } from './logs.service';
import { SystemModule } from 'src/system/system.module';
import { PrismaModule } from 'src/prisma.module';

@Module({
  imports: [SystemModule, PrismaModule],
  providers: [LogsService],
  exports: [LogsService]
})
export class LogsModule {}
