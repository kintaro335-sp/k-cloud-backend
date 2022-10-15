import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// exceptions
import { NotFoundException } from './exceptions/NotFound.exception';
// interfaces
import { ListFile, File, Folder } from './interfaces/list-file.interface';
import { UserPayload } from '../auth/interfaces/userPayload.interface';
// fs and path
import { existsSync, readdirSync, createReadStream, ReadStream, createWriteStream, lstatSync } from 'fs';
import { readdir, lstat, mkdir, rm, rmdir } from 'fs/promises';
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

  async isDirectoryUser(path: string, userPayload: UserPayload): Promise<boolean> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (!existsSync(entirePath)) {
      throw new NotFoundException(entirePath);
    }
    const statFile = await lstat(entirePath);
    return statFile.isDirectory();
  }

  async isDirectory(path: string, injectRoot = true): Promise<boolean> {
    const entirePath = injectRoot ? join(this.root, path) : path;
    if (!existsSync(entirePath)) {
      throw new NotFoundException(entirePath);
    }
    return (await lstat(entirePath)).isDirectory();
  }

  async getFileProperties(path: string, injectRoot = true): Promise<File> {
    const entirePath = injectRoot ? join(this.root, path) : path;
    if (await this.isDirectory(entirePath, false)) {
      throw new BadRequestException('Es una Carpeta');
    }
    const fileStat = await lstat(entirePath, { bigint: false });
    const file = entirePath.split('/').pop();

    return { name: file, type: 'file', size: fileStat.size, extension: file.split('.').pop(), mime_type: lookup(file.split('.').pop()) || '' };
  }

  async getFilePropertiesUser(path: string, userPayload: UserPayload): Promise<File> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (await this.isDirectory(entirePath, false)) {
      throw new BadRequestException('Es una Carpeta');
    }
    const fileStat = await lstat(entirePath, { bigint: false });
    const file = entirePath.split('/').pop();
    return { name: file, type: 'file', size: fileStat.size, extension: file.split('.').pop(), mime_type: lookup(file.split('.').pop()) || '' };
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
      const fileStat = lstatSync(filePath, { bigint: false });
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
    if (!(await lstat(entirePath)).isDirectory()) {
      await rm(entirePath);
      return Promise.resolve({ message: 'File deleted successfully' });
    }
    await rmdir(entirePath, { recursive: true });
    return Promise.resolve({ message: 'Folder deleted successfully' });
  }

  async createFolder(path: string, userPayload: UserPayload): Promise<{ meesage: string }> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (existsSync(entirePath)) {
      throw new BadRequestException('Folder already exists');
    }
    await mkdir(entirePath, { recursive: true });
    return Promise.resolve({ meesage: 'Folder created successfully' });
  }

  async GenerateTree(path: string, userPayload: UserPayload | null, rec: boolean): Promise<Folder | File> {
    const pathWithUser = userPayload !== null ? join(this.root, userPayload.userId, path) : join(this.root, path);
    const entirePath = rec ? path : pathWithUser;
    if (!this.isDirectory(path, !rec)) {
      const fileStat = await lstat(entirePath, { bigint: false });
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
            const fileStat = await lstat(filePath, { bigint: false });

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

  async getUsedSpace() {
    const filesTree = await this.GenerateTree('', null, false);
    const usedSpace = { value: 0 };
    if (filesTree.type === 'Folder') {
      const onForEach = (file: File | Folder) => {
        if (file.type === 'Folder') {
          file.content.forEach(onForEach);
        }
        if (file.type === 'file') {
          usedSpace.value = usedSpace.value + file.size;
        }
      };
      filesTree.content.forEach(onForEach);
      return usedSpace.value;
    } else {
      return 0;
    }
  }

  getRoot(): string {
    return this.root;
  }
}
