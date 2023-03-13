import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, Sharedfile } from '@prisma/client';
import { join } from 'path';

@Injectable()
export class TokenFilesService {
  group = 15;
  constructor(private readonly prismaService: PrismaService) {}

  addSharedFile(sharedFile: Prisma.SharedfileCreateInput) {
    return this.prismaService.sharedfile.create({ data: sharedFile });
  }

  getSharedFileByID(id: string) {
    return this.prismaService.sharedfile.findUnique({ where: { id } });
  }

  async getSharedFiles(page: number): Promise<Sharedfile[]> {
    const skip = page * this.group;
    return this.prismaService.sharedfile.findMany({ take: this.group, skip });
  }

  async getCountSharedPages(): Promise<number> {
    const count = await this.prismaService.sharedfile.count();
    return Math.ceil(count / this.group);
  }

  async getSahredFiles(path: string, userid: string): Promise<Sharedfile[]> {
    const entirePath = join(userid, path);
    return this.prismaService.sharedfile.findMany({ where: { path: entirePath } });
  }

  async removeSharedFile(id: string) {
    await this.prismaService.sharedfile.delete({ where: { id } });
  }

  async updateSF(id: string, newData: Prisma.SharedfileUpdateInput) {
    await this.prismaService.sharedfile.update({ where: { id }, data: newData });
  }
}
