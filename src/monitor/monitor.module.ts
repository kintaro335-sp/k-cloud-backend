import { Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { SystemModule } from '../system/system.module'

@Module({
  imports: [SystemModule],
  providers: [MonitorService],
  exports: [MonitorService]
})
export class MonitorModule {}
