import { Module } from '@nestjs/common';
import { SharedFileController } from './shared-file.controller';
import { SharedFileService } from './shared-file.service';
// module
import { FilesModule } from '../files/files.module';
import { TokenFilesModule } from '../token-files/token-files.module';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [FilesModule, TokenFilesModule, UtilsModule],
  controllers: [SharedFileController],
  providers: [SharedFileService]
})
export class SharedFileModule {}
