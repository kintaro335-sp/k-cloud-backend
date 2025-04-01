/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma.module';
import { SessionsService } from './sessions.service';
// modules
import { UsersModule } from '../users/users.module';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [SystemModule, UsersModule, PrismaModule],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}

