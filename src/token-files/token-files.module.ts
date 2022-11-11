import { Module } from '@nestjs/common';
import { TokenFilesService } from './token-files.service';

@Module({
  providers: [TokenFilesService],
  exports: [TokenFilesService]
})
export class TokenFilesModule {}
