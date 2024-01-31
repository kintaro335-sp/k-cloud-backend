import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Folder, File } from '../files/interfaces/list-file.interface';
import { deflateRaw, inflateRaw, constants } from 'node:zlib';

@Injectable()
export class TreeFilesService {
  constructor(private prismaServ: PrismaService) {}

  private async compressTree(content: Buffer): Promise<null | Buffer> {
    return new Promise((res) => {
      deflateRaw(
        content,
        {
          chunkSize: 10 * 1024,
          level: constants.Z_MAX_LEVEL,
          memLevel: constants.Z_MAX_MEMLEVEL,
          strategy: constants.Z_DEFAULT_STRATEGY
        },
        (err, result) => {
          if (err !== null) {
            res(null);
          }
          res(result);
        }
      );
    });
  }

  async unzip(content: Buffer): Promise<Buffer | null> {
    return new Promise((res) => {
      inflateRaw(content, (err, result) => {
        if (err) {
          res(null);
        }
        res(result);
      });
    });
  }

  async getTreeCache(userid: string) {
    const treeReg = await this.prismaServ.tree.findUnique({ where: { userid } });
    if (treeReg === null) return null;
    const uncompressedContent = await this.unzip(treeReg.content);
    if (uncompressedContent === null) return null;
    const treeString = uncompressedContent.toString('utf8');
    return JSON.parse(treeString) as File | Folder;
  }

  async setTreeCache(userid: string, tree: File | Folder) {
    const treeString = JSON.stringify(tree);
    const compressedContent = await this.compressTree(Buffer.from(treeString));
    if (compressedContent === null) {
      return null;
    }
    const regt = await this.prismaServ.tree.findUnique({ where: { userid } });
    if (regt) {
      return this.updateTree(userid, compressedContent);
    }
    return this.saveTree(userid, compressedContent);
  }

  async existsTree(userid: string) {
    const count = await this.prismaServ.tree.count({ where: { userid } });
    return count !== 0;
  }

  private async updateTree(userid: string, content: Buffer) {
    while (true) {
      try {
        return this.prismaServ.tree.update({ where: { userid }, data: { content } });
      } catch (_err) {}
    }
  }

  private async saveTree(userid: string, content: Buffer) {
    while (true) {
      try {
        return this.prismaServ.tree.create({ data: { userid, content, compressed: true } });
      } catch (_err) {}
    }
  }
}
