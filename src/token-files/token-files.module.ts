/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
import { TokenFilesService } from './token-files.service';
import { PrismaModule } from 'src/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TokenFilesService],
  exports: [TokenFilesService]
})
export class TokenFilesModule {}
