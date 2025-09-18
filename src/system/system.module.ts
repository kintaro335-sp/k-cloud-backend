/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common'
import { SystemService } from './system.service'

@Module({
  imports: [],
  providers: [SystemService],
  exports: [SystemService]
})
export class SystemModule {}
