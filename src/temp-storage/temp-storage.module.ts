/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
import { UtilsModule } from '../utils/utils.module';
import { TempStorageService } from './temp-storage.service';

@Module({
  imports: [UtilsModule],
  providers: [TempStorageService],
  exports: [TempStorageService]
})
export class TempStorageModule {}
