import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// exceptions
import { NotFoundException } from './exceptions/NotFound.exception';
// interfaces
import { ListFile, File } from './interfaces/list-file.interface';
import { UserPayload } from '../auth/interfaces/userPayload.interface';
// fs and path
import { existsSync, readdirSync, createReadStream, ReadStream, lstatSync, mkdirSync, createWriteStream, rmSync, rmdirSync } from 'fs';
import { join } from 'path';
import { lookup } from 'mime-types';
import { Express } from 'express';

@Injectable()
export class FilesService {
  private root: string = '~/';
  constructor(private readonly configService: ConfigService) {
    this.root = this.configService.get<string>('FILE_ROOT');
  }

  exists(path: string, userPayload: UserPayload): boolean {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    return existsSync(entirePath);
  }

  isDirectory(path: string, userPayload: UserPayload): boolean {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (!existsSync(entirePath)) {
      throw new NotFoundException();
    }
    return lstatSync(entirePath).isDirectory();
  }

  async getListFiles(path: string, userPayload: UserPayload): Promise<ListFile> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (!existsSync(entirePath)) {
      throw new NotFoundException();
    }
    const list: File[] = [];
    const listFiles = readdirSync(entirePath);

    listFiles.forEach((file) => {
      const filePath = join(entirePath, file);
      const fileStat = lstatSync(filePath);
      if (fileStat.isDirectory()) {
        list.push({
          name: file,
          type: 'folder',
          size: fileStat.size,
          extension: '',
          mime_type: ''
        });
      } else {
        list.push({
          name: file,
          type: 'file',
          size: fileStat.size,
          extension: file.split('.').pop(),
          mime_type: lookup(file.split('.').pop()) || ''
        });
      }
    });

    return { list };
  }

  async getFile(path: string, userPayload: UserPayload): Promise<ReadStream> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (!existsSync(entirePath)) {
      throw new NotFoundException();
    }
    return createReadStream(entirePath);
  }

  async createFile(path: string, file: Express.Multer.File, userPayload: UserPayload) {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (existsSync(`${entirePath}/${file.originalname}`)) {
      throw new BadRequestException('File already exists');
    }
    const writeStream = createWriteStream(`${entirePath}/${file.originalname}`);
    writeStream.write(file.buffer);
    writeStream.close();
    return Promise.resolve({ meesage: 'File created successfully' });
  }

  async deleteFile(path: string, userPayload: UserPayload): Promise<{ message: string }> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (!existsSync(entirePath)) {
      throw new NotFoundException();
    }
    if (!lstatSync(entirePath).isDirectory()) {
      rmSync(entirePath);
      return Promise.resolve({ message: 'File deleted successfully' });
    }
    rmdirSync(entirePath, { recursive: true });
    return Promise.resolve({ message: 'Folder deleted successfully' });
  }

  async createFolder(path: string, userPayload: UserPayload): Promise<{ meesage: string }> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (existsSync(entirePath)) {
      throw new BadRequestException('Folder already exists');
    }
    mkdirSync(entirePath, { recursive: true });
    return Promise.resolve({ meesage: 'Folder created successfully' });
  }

  getRoot(): string {
    return this.root;
  }
}
