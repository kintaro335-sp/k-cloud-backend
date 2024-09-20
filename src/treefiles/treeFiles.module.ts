/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
import { TreeFilesService } from './treeFiles.service';
import { PrismaService } from '../prisma.service';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [UtilsModule],
  providers: [TreeFilesService, PrismaService],
  controllers: [],
  exports: [TreeFilesService]
})
export class TreeFilesModule {}
