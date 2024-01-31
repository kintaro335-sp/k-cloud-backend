import { Module } from '@nestjs/common';
import { TreeFilesService } from './treeFiles.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [],
  providers: [TreeFilesService, PrismaService],
  controllers: [],
  exports: [TreeFilesService]
})
export class TreeFilesModule {}
