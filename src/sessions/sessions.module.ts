/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service'
import { SessionsService } from './sessions.service';
// modules
import { UsersModule } from '../users/users.module';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [SystemModule, UsersModule],
  providers: [SessionsService, PrismaService],
  exports: [SessionsService],
})
export class SessionsModule {}

