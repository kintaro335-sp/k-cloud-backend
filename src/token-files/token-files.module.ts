/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
import { TokenFilesService } from './token-files.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [TokenFilesService, PrismaService],
  exports: [TokenFilesService]
})
export class TokenFilesModule {}
