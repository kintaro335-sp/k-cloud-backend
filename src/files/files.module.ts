import { Module, forwardRef } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
// imports
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { UtilsModule } from '../utils/utils.module';
import { TempStorageModule } from '../temp-storage/temp-storage.module';
import { TokenFilesModule } from '../token-files/token-files.module';
@Module({
  imports: [TempStorageModule, UtilsModule, forwardRef(() => AdminModule), AuthModule, TokenFilesModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService]
})
export class FilesModule {}
