/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers:[PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
