/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
import { SharedFileController } from './shared-file.controller';
import { SharedFileService } from './shared-file.service';
// module
import { FilesModule } from '../files/files.module';
import { TokenFilesModule } from '../token-files/token-files.module';
import { UtilsModule } from '../utils/utils.module';
import { SystemModule } from '../system/system.module';
import { LogsModule } from 'src/logs/logs.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [SystemModule, FilesModule, TokenFilesModule, UtilsModule, LogsModule, SessionsModule],
  controllers: [SharedFileController],
  providers: [SharedFileService]
})
export class SharedFileModule {}
