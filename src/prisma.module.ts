/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers:[PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
