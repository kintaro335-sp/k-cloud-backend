import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
// otrher
import { UtilsModule } from '../utils/utils.module';
import { TempStorageModule } from '../temp-storage/temp-storage.module';
@Module({
  imports: [TempStorageModule, UtilsModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService]
})
export class FilesModule {}
