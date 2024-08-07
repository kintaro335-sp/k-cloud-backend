import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, Sharedfile } from '@prisma/client';

@Injectable()
export class TokenFilesService {
  private group = 64;
  constructor(private readonly prismaService: PrismaService) {}

  async addSharedFile(sharedFile: Prisma.SharedfileCreateInput) {
    while (true) {
      try {
        return await this.prismaService.sharedfile.create({ data: sharedFile });
      } catch (err) {}
    }
  }

  async getSharedFileByID(id: string) {
    while (true) {
      try {
        return this.prismaService.sharedfile.findUnique({ where: { id } });
      } catch (err) {}
    }
  }

  async getCountByPath(path: string): Promise<number> {
    while (true) {
      try {
        return this.prismaService.sharedfile.count({ where: { path } });
      } catch (err) {}
    }
  }

  async getSharedFiles(page: number): Promise<Sharedfile[]> {
    while (true) {
      const today = new Date();
      try {
        const skip = page * this.group;
        return this.prismaService.sharedfile.findMany({
          take: this.group,
          skip,
          where: {
            OR: [
              { public: true, doesexpires: false },
              { public: true, doesexpires: true, expire: { gt: today } }
            ]
          }
        });
      } catch (err) {}
    }
  }

  async getCountSharedPages(): Promise<number> {
    while (true) {
      const today = new Date();
      try {
        const count = await this.prismaService.sharedfile.count({
          where: {
            OR: [
              { public: true, doesexpires: false },
              { public: true, doesexpires: true, expire: { gt: today } }
            ]
          }
        });
        return Math.ceil(count / this.group);
      } catch (err) {}
    }
  }

  async getSharedFilesByPathUserID(path: string, userid: string): Promise<Sharedfile[]> {
    while (true) {
      try {
        return this.prismaService.sharedfile.findMany({ where: { path, userid } });
      } catch (err) {}
    }
  }

  async removeSharedFile(id: string) {
    while (true) {
      try {
        await this.prismaService.sharedfile.delete({ where: { id } });
        return;
      } catch (err) {}
    }
  }

  async deleteTokensByPath(path: string, userid: string) {
    while (true) {
      try {
        await this.prismaService.sharedfile.deleteMany({ where: { path, userid } });
        return;
      } catch (err) {}
    }
  }

  async updateSF(id: string, newData: Prisma.SharedfileUpdateInput) {
    while (true) {
      try {
        return await this.prismaService.sharedfile.update({ where: { id }, data: newData });
      } catch (err) {}
    }
  }

  async updatePathTokens(oldpath: string, newPath: string) {
    await this.prismaService.sharedfile.updateMany({ data: { path: newPath }, where: { path: oldpath } });
    const tokens = await this.prismaService.sharedfile.findMany({ where: { path: { startsWith: oldpath } } });
    tokens.forEach(async (t) => {
      const newPathT = t.path.replace(oldpath, newPath);
      while (true) {
        try {
          await this.prismaService.sharedfile.update({ data: { path: newPathT }, where: { id: t.id } });
          break;
        } catch (err) {}
      }
    });
  }

  async getTokensByUser(userid: string, page: number) {
    while (true) {
      try {
        const skip = page * this.group;
        return this.prismaService.sharedfile.findMany({ skip, take: this.group, where: { userid } });
      } catch (err) {}
    }
  }

  async getPagesNumberByUser(userid: string): Promise<number> {
    while (true) {
      try {
        const count = await this.prismaService.sharedfile.count({ where: { userid } });
        return Math.ceil(count / this.group);
      } catch (err) {}
    }
  }
}
