import { Module } from '@nestjs/common'
import { SystemService } from './system.service'

@Module({
  imports: [],
  providers: [SystemService],
  exports: [SystemService]
})
export class SystemModule {}
