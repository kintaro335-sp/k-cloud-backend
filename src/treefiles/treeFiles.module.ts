/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
import { TreeFilesService } from './treeFiles.service';
import { PrismaModule } from 'src/prisma.module';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [UtilsModule, PrismaModule],
  providers: [TreeFilesService],
  controllers: [],
  exports: [TreeFilesService]
})
export class TreeFilesModule {}
