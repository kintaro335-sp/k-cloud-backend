/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';
// modules
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [UsersModule, AuthModule, AdminModule],
  controllers: [SetupController],
  providers: [SetupService]
})
export class SetupModule {}
