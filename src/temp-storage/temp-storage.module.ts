import { Module } from '@nestjs/common';
import { TempStorageService } from './temp-storage.service';

@Module({
  providers: [TempStorageService]
})
export class TempStorageModule {}
