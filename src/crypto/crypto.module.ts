/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';

@Module({
  providers: [CryptoService],
  exports: [CryptoService]
})
export class CryptoModule {}
