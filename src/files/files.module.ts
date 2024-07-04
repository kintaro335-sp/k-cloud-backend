import { Module, forwardRef } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
// imports
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { UtilsModule } from '../utils/utils.module';
import { TempStorageModule } from '../temp-storage/temp-storage.module';
import { TokenFilesModule } from '../token-files/token-files.module';
import { SystemModule } from '../system/system.module';
import { TreeFilesModule } from '../treefiles/treeFiles.module';
import { UsersModule } from '../users/users.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [SystemModule, TempStorageModule, UtilsModule, forwardRef(() => AdminModule), AuthModule, TokenFilesModule, TreeFilesModule, UsersModule, SessionsModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService]
})
export class FilesModule {}
