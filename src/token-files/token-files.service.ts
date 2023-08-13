import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, Sharedfile } from '@prisma/client';
import { join } from 'path';

@Injectable()
export class TokenFilesService {
  private group = 16;
  constructor(private readonly prismaService: PrismaService) {}

  async addSharedFile(sharedFile: Prisma.SharedfileCreateInput) {
    return this.prismaService.sharedfile.create({ data: sharedFile });
  }

  async getSharedFileByID(id: string) {
    return this.prismaService.sharedfile.findUnique({ where: { id } });
  }

  async getCountByPath(path: string): Promise<number> {
    return this.prismaService.sharedfile.count({ where: { path } });
  }

  async getSharedFiles(page: number): Promise<Sharedfile[]> {
    const skip = page * this.group;
    return this.prismaService.sharedfile.findMany({ take: this.group, skip, where: { doesexpires: false } });
  }

  async getCountSharedPages(): Promise<number> {
    const count = await this.prismaService.sharedfile.count({ where: { doesexpires: false } });
    return Math.ceil(count / this.group);
  }

  async getSharedFilesByPathUserID(path: string, userid: string): Promise<Sharedfile[]> {
    return this.prismaService.sharedfile.findMany({ where: { path, userid } });
  }

  async removeSharedFile(id: string) {
    await this.prismaService.sharedfile.delete({ where: { id } });
  }

  async deleteTokensByPath(path: string, userid: string) {
    await this.prismaService.sharedfile.deleteMany({ where: { path, userid } });
  }

  async updateSF(id: string, newData: Prisma.SharedfileUpdateInput) {
    await this.prismaService.sharedfile.update({ where: { id }, data: newData });
  }

  async updatePathTokens(oldpath: string, newPath: string) {
    await this.prismaService.sharedfile.updateMany({ data: { path: newPath }, where: { path: oldpath } });
  }
}
