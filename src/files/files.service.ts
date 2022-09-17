import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// exceptions
import { NotFoundException } from './exceptions/NotFound.exception';
// interfaces
import { ListFile, File, Folder } from './interfaces/list-file.interface';
import { UserPayload } from '../auth/interfaces/userPayload.interface';
// fs and path
import { existsSync, readdirSync, createReadStream, ReadStream, lstatSync, mkdirSync, createWriteStream, rmSync, rmdirSync } from 'fs';
import { readdir, lstat } from 'fs/promises';
import { join } from 'path';
import { lookup } from 'mime-types';

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

  isDirectoryUser(path: string, userPayload: UserPayload): boolean {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (!existsSync(entirePath)) {
      throw new NotFoundException(entirePath);
    }
    return lstatSync(entirePath).isDirectory();
  }

  isDirectory(path: string, injectRoot = true): boolean {
    const entirePath = injectRoot ? join(this.root, path) : path;
    if (!existsSync(entirePath)) {
      throw new NotFoundException(entirePath);
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

  async GenerateTree(path: string, userPayload: UserPayload, rec: boolean): Promise<Folder | File> {
    const { userId } = userPayload;
    const entirePath = rec ? path : join(this.root, userId, path);
    console.log(entirePath);
    if (!this.isDirectory(path, !rec)) {
      const fileStat = await lstat(entirePath);
      return {
        type: 'file',
        name: path.split('/').pop(),
        extension: path.split('.').pop(),
        mime_type: lookup(path.split('.').pop()) || '',
        size: fileStat.size
      };
    }
    const files = await readdir(entirePath);

    const folder: Folder = {
      type: 'Folder',
      name: entirePath.split('/').pop(),
      content: await Promise.all(
        files.map(async (f): Promise<File | Folder> => {
          const filePath = join(entirePath, f);
          try {
            const fileStat = await lstat(filePath);

            if (fileStat.isDirectory()) {
              return {
                type: 'Folder',
                name: f,
                content: await Promise.all((await readdir(filePath)).map(async (fi) => this.GenerateTree(join(filePath, fi), userPayload, true)))
              };
            } else {
              return {
                name: f,
                type: 'file',
                size: fileStat.size,
                extension: f.split('.').pop(),
                mime_type: lookup(f.split('.').pop()) || ''
              };
            }
          } catch (err) {
            console.error(err);
          }
        })
      )
    };
    return folder;
  }

  getRoot(): string {
    return this.root;
  }
}
