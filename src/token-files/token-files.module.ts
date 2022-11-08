import { Module } from '@nestjs/common';
import { TokenFilesService } from './token-files.service';

@Module({
  providers: [TokenFilesService]
})
export class TokenFilesModule {}
