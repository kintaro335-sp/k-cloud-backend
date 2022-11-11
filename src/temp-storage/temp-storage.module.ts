import { Module } from '@nestjs/common';
import { TempStorageService } from './temp-storage.service';

@Module({
  providers: [TempStorageService],
  exports: [TempStorageService]
})
export class TempStorageModule {}
