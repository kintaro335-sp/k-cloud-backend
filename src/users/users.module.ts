/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [UsersService, PrismaService],
  exports: [UsersService]
})
export class UsersModule {}
