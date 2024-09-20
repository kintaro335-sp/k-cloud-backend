/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
// services
import { LogsService } from './logs.service';
import { SystemModule } from 'src/system/system.module'; 
import { PrismaService } from '../prisma.service';

@Module({
  imports: [SystemModule],
  providers: [LogsService, PrismaService],
  exports: [LogsService]
})
export class LogsModule {}
