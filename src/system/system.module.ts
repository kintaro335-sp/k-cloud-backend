/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
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
