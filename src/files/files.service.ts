import { BadRequestException, Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
// services
import { TempStorageService } from '../temp-storage/temp-storage.service';
import { AdminService } from '../admin/admin.service';
import { TokenFilesService } from '../token-files/token-files.service';
// exceptions
import { NotFoundException } from './exceptions/NotFound.exception';
// interfaces
import { ListFile, File, Folder, UsedSpaceType } from './interfaces/list-file.interface';
import { UserPayload } from '../auth/interfaces/userPayload.interface';
import { MessageResponse } from '../auth/interfaces/response.interface';
import { BlobFTemp } from '../temp-storage/interfaces/filep.interface';
// fs and path
import { existsSync, createReadStream, ReadStream, createWriteStream } from 'fs';
import { readdir, lstat, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { lookup } from 'mime-types';
import { orderBy } from 'lodash';

@Injectable()
export class FilesService {
  public root: string = '~/';
  constructor(
    private readonly configService: ConfigService,
    private readonly storageService: TempStorageService,
    @Inject(forwardRef(() => AdminService)) private readonly adminServ: AdminService,
    private readonly tokenServ: TokenFilesService
  ) {
    this.root = this.configService.get<string>('FILE_ROOT');
  }

  /**
   * mandar a Escribir numerosos blobs de los archivos
   */
  @Interval(10000)
  async writeBlobs() {
    this.storageService.getFilesDirectories().forEach(async (dir) => {
      if (this.storageService.getWritting(dir)) return;

      while (this.storageService.getBlobsLength(dir) !== 0) {
        this.storageService.setWritting(dir, true);
        const blob = this.storageService.deallocateBlob(dir);
        if (blob !== undefined) {
          try {
            const realPath = join(this.root, dir);
            await this.storageService.writeBlob(realPath, blob);
            this.storageService.updateBytesWriten(dir, blob);
            if (this.storageService.isCompleted(dir)) {
              this.storageService.delFile(dir);
              this.adminServ.updateUsedSpace();
            }
          } catch (err) {
            this.storageService.allocateBlob(dir, blob.position, blob.blob);
            console.error(err);
          }
        }
      }
      this.storageService.setWritting(dir, false);
    });
  }

  /**
   * Escfibir un blolb de un fichero que provenga de tempStorageService
   * @param {string} path Direccion del archivo
   * @param {BlobFTemp} blobp Blob a escribir
   * @returns {number}  Numbero de Bytes escritos
   */
  private async onWriteBlob(path: string, blobp: BlobFTemp): Promise<number> {
    const writeStreamF = createWriteStream(path, { start: blobp.position, flags: 'w' });
    writeStreamF.write(blobp.blob);
    writeStreamF.close();
    return blobp.blob.length;
  }

  /**
   * verificar si un archivo existe
   * @param {string} path
   * @param {UserPayload} userPayload
   * @returns {boolean}
   */
  exists(path: string, userPayload: UserPayload): boolean {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    return existsSync(entirePath);
  }

  /**
   * Verificar si es un directorio
   * @param {string} path Direccion
   * @param {UserPayload} userPayload Datos de usuario autenticado
   * @returns {Promise<boolean>}
   */
  async isDirectoryUser(path: string, userPayload: UserPayload): Promise<boolean> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (!existsSync(entirePath)) {
      throw new NotFoundException(path);
    }
    const statFile = await lstat(entirePath);
    return statFile.isDirectory();
  }

  /**
   * Determinar a partir de una direccion si es directorio o fichero
   * @param {string} path Directorio
   * @param {boolean} injectRoot injectar la raiz del directorio (valo por defecto `true`)
   * @returns {Promise<boolean>} `true` si es un directorio
   */
  async isDirectory(path: string, injectRoot = true): Promise<boolean> {
    const entirePath = injectRoot ? join(this.root, path) : path;
    if (!existsSync(entirePath)) {
      throw new NotFoundException(entirePath);
    }
    return (await lstat(entirePath)).isDirectory();
  }

  /**
   * Obtener la Propiedades de un Archivo (autenticacion no requerida)
   * @param {string} path directorio del archivo
   * @param {boolean} injectRoot injectar la raiz del directorio (valo por defecto `true`)
   * @returns {Promise<File>}
   */
  async getFileProperties(path: string, injectRoot: boolean = true): Promise<File> {
    const entirePath = injectRoot ? join(this.root, path) : path;
    if (await this.isDirectory(entirePath, false)) {
      throw new BadRequestException('Es una Carpeta');
    }
    const fileStat = await lstat(entirePath, { bigint: false });
    const file = entirePath.split('/').pop();
    const tokens = await this.tokenServ.getCountByPath(path);

    return {
      name: file,
      type: 'file',
      size: fileStat.size,
      tokens,
      extension: file.split('.').pop(),
      mime_type: lookup(file.split('.').pop()) || ''
    };
  }

  /**
   * Obtener las propiedades de un Archivo cuando el usuario esta autenticado
   * @param {string} path Directorio
   * @param {UserPayload} userPayload Datos de usuario autenticado
   * @returns {Promise<File>}
   */
  async getFilePropertiesUser(path: string, userPayload: UserPayload): Promise<File> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (await this.isDirectory(entirePath, false)) {
      throw new BadRequestException('Es una Carpeta');
    }
    const fileStat = await lstat(entirePath, { bigint: false });
    const file = entirePath.split('/').pop();
    const tokens = await this.tokenServ.getCountByPath(path);
    return {
      name: file,
      type: 'file',
      size: fileStat.size,
      tokens,
      extension: file.split('.').pop(),
      mime_type: lookup(file.split('.').pop()) || ''
    };
  }

  async getFileSize(path: string, injectRoot: boolean = true): Promise<number> {
    const entirePath = injectRoot ? join(this.root, path) : path;
    const fileStat = await lstat(entirePath, { bigint: false });
    return fileStat.size;
  }

  /**
   * Obtener la Lista de archivo que hay en un directorio
   * @param {string} path Directorio
   * @param {UserPayload}  userPayload Datos de usuario autenticado
   * @returns {Promise<ListFile>}
   */
  async getListFiles(path: string, userPayload: UserPayload): Promise<ListFile> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (!existsSync(entirePath)) {
      throw new NotFoundException();
    }

    const listFiles = await readdir(entirePath);

    const list: File[] = await Promise.all(
      listFiles.map(async (file) => {
        const filePath = join(entirePath, file);
        const fileStat = await lstat(filePath, { bigint: false });
        const tokens = await this.tokenServ.getCountByPath(join(path, file));
        if (fileStat.isDirectory()) {
          return {
            name: file,
            type: 'folder',
            size: fileStat.size,
            tokens,
            extension: '',
            mime_type: ''
          };
        }
        return {
          name: file,
          type: 'file',
          size: fileStat.size,
          tokens,
          extension: file.split('.').pop(),
          mime_type: lookup(file.split('.').pop()) || ''
        };
      })
    );
    const ordenedList = orderBy<File>(list, ['type', 'name'], ['desc', 'asc']);
    return { list: ordenedList };
  }

  /**
   * Obtener el `ReadStream` de un archivo para entregaro
   * @param {string} path Directorio
   * @param {UserPayload} userPayload Datos de usuario autenticado
   * @returns {Promise<ReadStream>} Readstream del archivo en cuestion
   */
  async getFile(path: string, userPayload: UserPayload): Promise<ReadStream> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (!existsSync(entirePath)) {
      throw new NotFoundException();
    }
    return createReadStream(entirePath);
  }

  /**
   * Guardar un archivo que se haya recibido
   * @param {string} path directorio
   * @param {Express.Multer.File} file Archivo a guardar
   * @param {UserPayload} userPayload Datos de usuario atenticado
   * @returns {Promise<MessageResponse>} Respuesta de la accion
   */
  async createFile(path: string, file: Express.Multer.File, userPayload: UserPayload): Promise<MessageResponse> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (existsSync(`${entirePath}/${file.originalname}`)) {
      throw new BadRequestException('File already exists');
    }
    const writeStream = createWriteStream(`${entirePath}/${file.originalname}`);
    writeStream.write(file.buffer);
    writeStream.close();
    return { message: 'File created successfully' };
  }

  /**
   * Eliminar un archivo
   * @param {string} path directorio
   * @param {UserPayload} userPayload datos de usuario autenticado
   * @returns {Promise<MessageResponse>}
   */
  async deleteFile(path: string, userPayload: UserPayload): Promise<MessageResponse> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    const storagePath = join(userId, path);
    if (this.storageService.existsFile(storagePath)) {
      this.storageService.delFile(storagePath);
    }

    if (!existsSync(entirePath)) {
      throw new NotFoundException();
    }
    if (!(await lstat(entirePath)).isDirectory()) {
      await rm(entirePath);
      return Promise.resolve({ message: 'File deleted successfully' });
    }
    await rm(entirePath, { recursive: true });
    this.tokenServ.deleteTokensByPath(path, userId);
    return { message: 'Folder deleted successfully' };
  }

  /**
   * Creatr una carpeta a partir de una direccion
   * @param {string} path directorio
   * @param {UserPayload} userPayload Datos de usuario autenticado
   * @returns {Promise<MessageResponse>} mensaje de la accion
   */
  async createFolder(path: string, userPayload: UserPayload): Promise<MessageResponse> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (existsSync(entirePath)) {
      throw new BadRequestException('Folder already exists');
    }
    await mkdir(entirePath, { recursive: true });
    return { message: 'Folder created successfully' };
  }

  /**
   * Obtener un arbol de como estan lo archivos
   * @param {string} path el directorio para crear el arbol
   * @param {UserPayload | null} userPayload
   * @param {boolean} rec incluir el user
   * @returns {Promise<Folder | File>} File si se detecta que el roor es File y el arbol si el carpeta
   */
  async GenerateTree(path: string, userPayload: UserPayload | null, rec: boolean, showFiles = true): Promise<Folder | File> {
    const pathWithUser = userPayload !== null ? join(this.root, userPayload.userId, path) : join(this.root, path);
    const entirePath = rec ? path : pathWithUser;
    const fileStat = await lstat(entirePath, { bigint: false });
    if (!fileStat.isDirectory()) {
      return {
        type: 'file',
        name: path.split('/').pop(),
        extension: path.split('.').pop(),
        tokens: 0,
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
                content: await Promise.all(
                  (await readdir(filePath))
                    .map(async (fi) => await this.GenerateTree(join(filePath, fi), userPayload, true))
                    .filter((f) => f !== null)
                )
              };
            } else if (showFiles) {
              return {
                type: 'file',
                name: f,
                size: fileStat.size,
                tokens: 0,
                mime_type: lookup(f.split('.').pop()) || '',
                extension: f.split('.').pop()
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

  /**
   * Obtener El espacio usado
   * @returns {Promise<number>} Espacio usado en Bytes
   */
  async getUsedSpace(): Promise<number> {
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

  /**
   * Obtener el espacio usado de un usuario
   * @param {string} userId id de usuario
   * @returns {Promise<number>} espacio usado por el usuario
   */
  async getUsedSpaceUser(userId: string): Promise<number> {
    if (!this.exists('', { isadmin: false, userId, username: '' })) return 0;
    const filesTree = await this.GenerateTree(userId, null, false);
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

  async getUsedSpaceByFileType(): Promise<UsedSpaceType[]> {
    const usedSpace: Record<string, number> = {};
    const sumBytes = (type: string, bytes: number) => {
      if (usedSpace[type] === undefined) {
        usedSpace[type] = bytes;
      } else {
        usedSpace[type] += bytes;
      }
    };
    const filesTree = await this.GenerateTree('', null, false);
    if (filesTree.type === 'Folder') {
      const onForEach = (file: File | Folder) => {
        if (file.type === 'Folder') {
          file.content.forEach(onForEach);
        }
        if (file.type === 'file') {
          if (file.mime_type.includes('image/')) {
            sumBytes('image', file.size);
          } else if (file.mime_type.includes('video/')) {
            sumBytes('video', file.size);
          } else if (file.mime_type.includes('compressed')) {
            sumBytes('compressed', file.size);
          } else {
            sumBytes('other', file.size);
          }
        }
      };
      filesTree.content.forEach(onForEach);
      return Object.keys(usedSpace).map((type) => ({ type, used: usedSpace[type] }));
    } else {
      return [];
    }
  }

  /**
   * Obtener el directorio Raiz donde estan alojados los archivos
   * @returns {string}
   */
  getRoot(): string {
    return this.root;
  }

  /**
   * Obtener el path real de un archivo
   * @returns {string}
   */
  getRealPath(path: string, user: UserPayload) {
    return join(this.root, user.userId, path);
  }
}
