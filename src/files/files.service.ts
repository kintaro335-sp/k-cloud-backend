import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// exceptions
import { NotFoundException } from './exceptions/NotFound.exception';
// interfaces
import { ListFile } from './interfaces/list-file.interface';
// fs and path
import { existsSync, readdirSync, createReadStream, ReadStream, lstatSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FilesService {
  private root: string = '~/';
  constructor(private readonly configService: ConfigService) {
    this.root = this.configService.get<string>('FILE_ROOT');
  }

  isDirectory(path: string): boolean {
    const entirePath = join(this.root, path);
    if (!existsSync(entirePath)) {
      throw new NotFoundException();
    }
    return lstatSync(entirePath).isDirectory();
  }

  async getListFiles(path: string): Promise<ListFile> {
    const entirePath = join(this.root, path);
    if (!existsSync(entirePath)) {
      throw new NotFoundException();
    }
    const files: string[] = [];
    const directories: string[] = [];
    const listFiles = readdirSync(entirePath);

    listFiles.forEach((file) => {
      const filePath = join(entirePath, file);
      if (lstatSync(filePath).isDirectory()) {
        directories.push(file);
      } else {
        files.push(file);
      }
    });

    return { directories, files };
  }

  async getFile(path: string): Promise<ReadStream> {
    const entirePath = join(this.root, path);
    if (!existsSync(entirePath)) {
      throw new NotFoundException();
    }
    return createReadStream(entirePath);
  }

  getRoot(): string {
    return this.root;
  }
}
