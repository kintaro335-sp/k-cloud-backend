import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, Sharedfile } from '@prisma/client';

@Injectable()
export class TokenFilesService {
  group = 15;
  constructor(private readonly prismaService: PrismaService) {}

  addSharedFile(sharedFile: Prisma.SharedfileCreateInput) {
    this.prismaService.sharedfile.create({ data: sharedFile });
  }

  async getSharedFiles(page: number) {
    const skip = page * this.group;
    return this.prismaService.sharedfile.findMany({ take: this.group, skip });
  }

  async getCountSharedPages(): Promise<number> {
    const count = await this.prismaService.sharedfile.count();
    return Math.ceil(count / this.group);
  }
}
