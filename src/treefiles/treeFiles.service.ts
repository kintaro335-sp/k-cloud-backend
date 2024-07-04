import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UtilsService } from 'src/utils/utils.service';
import { Folder, File } from '../files/interfaces/list-file.interface';
import { deflateRaw, inflateRaw, constants } from 'node:zlib';
import { join } from 'path';
import { IndexList } from './interfaces/indexelement.interface';

@Injectable()
export class TreeFilesService {
  constructor(private prismaServ: PrismaService, private utils: UtilsService) {}

  private async compressContent(content: Buffer): Promise<null | Buffer> {
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
    const treeReg = await this.prismaServ.tree.findUnique({ select: { content: true }, where: { userid } });
    if (treeReg === null) return null;
    const uncompressedContent = await this.unzip(treeReg.content);
    if (uncompressedContent === null) return null;
    const treeString = uncompressedContent.toString('utf8');
    return JSON.parse(treeString) as File | Folder;
  }

  async getIndexCache(userid: string) {
    const treeReg = await this.prismaServ.tree.findUnique({ select: { index: true }, where: { userid } });
    if (treeReg === null) return null;
    const uncompressedContent = await this.unzip(treeReg.index);
    if (uncompressedContent === null) return null;
    const indexString = uncompressedContent.toString('utf8');
    return JSON.parse(indexString) as IndexList;
  }

  private createIndex(tree: File | Folder) {
    const index: IndexList = [];
    const getOnForEach = (path = '') => {
      return (val: File | Folder) => {
        if (val.type === 'file') {
          index.push({ name: val.name, path: join(path, val.name), size: val.size, mime_type: val.mime_type });
        }
        if (val.type === 'Folder') {
          index.push({ name: val.name, path: join(path, val.name), size: val.size, mime_type: 'Folder' });
          val.content.forEach(getOnForEach(join(path, val.name)));
        }
      };
    };
    if (tree.type == 'Folder') {
      tree.content.forEach(getOnForEach(''));
    }

    return this.utils.quickSort(index);
  }

  async setTreeCache(userid: string, tree: File | Folder) {
    const treeString = JSON.stringify(tree);
    const index = this.createIndex(tree);
    const indexString = JSON.stringify(index);
    const compressedContent = await this.compressContent(Buffer.from(treeString));
    const compressedIndex = await this.compressContent(Buffer.from(indexString));
    if (compressedContent === null) {
      return null;
    }
    const regt = await this.prismaServ.tree.findUnique({ where: { userid } });
    if (regt) {
      return this.updateTree(userid, compressedContent, compressedIndex);
    }
    return this.saveTree(userid, compressedContent, compressedIndex);
  }

  private async decompressUserTree(compressedTree: Buffer): Promise<Folder> {
    const unCompressed = await this.unzip(compressedTree);
    const folder = JSON.parse(unCompressed.toString('utf-8')) as Folder;
    return folder;
  }

  async getTree(userId = ''): Promise<Folder> {
    if (userId !== '') {
      const tree = await this.prismaServ.tree.findUnique({ select: { content: true }, where: { userid: userId } });
      return this.decompressUserTree(tree.content)
    }
    const FolderRoot: Folder = {
      name: 'root',
      size: 4096,
      type: 'Folder',
      content: []
    };
    const trees = await this.prismaServ.tree.findMany({ select: { content: true } });
    FolderRoot.content = await Promise.all(trees.map(async (t) => this.decompressUserTree(t.content)));
    return FolderRoot;
  }

  async existsTree(userid: string) {
    const count = await this.prismaServ.tree.count({ where: { userid } });
    return count !== 0;
  }

  private async updateTree(userid: string, content: Buffer, index: Buffer) {
    while (true) {
      try {
        return this.prismaServ.tree.update({ where: { userid }, data: { content, index } });
      } catch (_err) {}
    }
  }

  private async saveTree(userid: string, content: Buffer, index: Buffer) {
    while (true) {
      try {
        return this.prismaServ.tree.create({ data: { userid, content, index } });
      } catch (_err) {}
    }
  }
}
