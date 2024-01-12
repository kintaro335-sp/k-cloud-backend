import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
// external modules
import { FilesModule } from '../files/files.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { LogsModule } from '../logs/logs.module';
import { MonitorModule } from '../monitor/monitor.module';
import { SystemModule } from '../system/system.module'

@Module({
  imports: [AuthModule, forwardRef(() => FilesModule), UsersModule, LogsModule, MonitorModule, SystemModule],
  exports: [AdminService],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
