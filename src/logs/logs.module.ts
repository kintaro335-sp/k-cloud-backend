import { Module } from '@nestjs/common';
// services
import { LogsService } from './logs.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [LogsService, PrismaService],
  exports: [LogsService]
})
export class LogsModule {}
