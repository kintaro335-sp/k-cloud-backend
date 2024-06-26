import { BadRequestException, Injectable, Inject, forwardRef, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval, Cron, CronExpression } from '@nestjs/schedule';
// services
import { TempStorageService } from '../temp-storage/temp-storage.service';
import { AdminService } from '../admin/admin.service';
import { TokenFilesService } from '../token-files/token-files.service';
import { SystemService } from '../system/system.service';
import { TreeFilesService } from '../treefiles/treeFiles.service';
import { UsersService } from '../users/users.service';
// exceptions
import { NotFoundException } from './exceptions/NotFound.exception';
// interfaces
import { ListFile, File, Folder, UsedSpaceType } from './interfaces/list-file.interface';
import { UserPayload } from '../auth/interfaces/userPayload.interface';
import { MessageResponse } from '../auth/interfaces/response.interface';
// fs and path
import { createReadStream, ReadStream, createWriteStream, access, constants } from 'fs';
import { readdir, lstat, mkdir, rm, rename } from 'fs/promises';
import { join } from 'path';
// utils
import { lookup } from 'mime-types';
import { orderBy } from 'lodash';
const JSZip = require('jszip');

@Injectable()
export class FilesService {
  public root: string = '~/';
  private userIndexUpdateScheduled = [];
  constructor(
    private readonly configService: ConfigService,
    private readonly storageService: TempStorageService,
    @Inject(forwardRef(() => AdminService)) private readonly adminServ: AdminService,
    private readonly tokenServ: TokenFilesService,
    private treeService: TreeFilesService,
    private usersService: UsersService,
    private system: SystemService
  ) {
    this.root = this.configService.get<string>('FILE_ROOT');
  }

  private addUserIndexUpdateSchedule(userId: string) {
    if (this.userIndexUpdateScheduled.includes(userId)) return;
    this.userIndexUpdateScheduled.push(userId);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  private async updateIndexes() {
    try {
      while (this.userIndexUpdateScheduled.length !== 0) {
        try {
          const u = this.userIndexUpdateScheduled.pop();
          await this.updateTree({ userId: u, username: '', isadmin: false });
        } catch (err) {
          console.error(err);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * mandar a Escribir numerosos blobs de los archivos
   */
  @Interval(500)
  async writeBlobs() {
    this.storageService.getFilesDirectories().forEach(async (dir) => {
      if (this.storageService.getWritting(dir)) return;
      if (!this.storageService.allowWriteMoreFiles()) return;

      while (this.storageService.getBlobsLength(dir) !== 0) {
        this.storageService.setWritting(dir, true);
        const blob = this.storageService.deallocateBlob(dir);

        if (blob !== undefined) {
          try {
            const realPath = join(this.root, dir);
            await this.storageService.writeBlob(realPath, blob);
            this.storageService.setWritting(dir, false);
            this.storageService.updateBytesWriten(dir, blob);
            const fileInfo = this.storageService.getFileInfo(dir);
            if (this.storageService.isCompleted(dir)) {
              const pathArr = fileInfo.path.split('/');
              pathArr.pop();
              const pathH = pathArr.join('/');

              const newFile = await this.getFileP(fileInfo.path, { isadmin: false, username: '', userId: fileInfo.userId });
              if (newFile !== null) {
                this.system.emitChangeFileUpdateEvent({ path: pathH, type: 'add', content: newFile, userid: fileInfo.userId });
              } else {
                this.system.emitChangeFileEvent({ path: pathH, userId: fileInfo.userId });
              }
              this.system.emitFileUploadRequest(fileInfo.userId);
              this.storageService.delFile(dir);
              this.addUserIndexUpdateSchedule(fileInfo.userId);
              this.adminServ.updateUsedSpace();
            }
            if (this.storageService.existsFile(dir)) {
              const fileStatus = this.storageService.getFileStatus(dir);
              this.system.emitChangeUpdateUploadEvent({ path: fileInfo.path, fileStatus, userid: fileInfo.userId });
            }
          } catch (err) {
            this.storageService.allocateBlob(dir, blob.position, blob.blob);
            console.error(err);
          }
        }
      }
    });
  }

  /**
   * verificar si un archivo existe
   * @param {string} path
   * @param {UserPayload} userPayload
   * @returns {Promise<boolean>}
   */
  exists(path: string, userPayload: UserPayload): Promise<boolean> {
    const { userId } = userPayload;
    // modify
    const entirePath = join(this.root, userId, path);
    return new Promise((res) => {
      access(entirePath, constants.F_OK, (err) => {
        const exists = err?.code !== 'ENOENT';
        res(exists);
      });
    });
  }

  existsEP(entirePath: string): Promise<boolean> {
    // modify
    return new Promise((res) => {
      access(entirePath, constants.F_OK, (err) => {
        const exists = err?.code !== 'ENOENT';
        res(exists);
      });
    });
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
    if (!(await this.exists(path, userPayload))) {
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
    if (!(await this.existsEP(entirePath))) {
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
    if (!(await this.existsEP(entirePath))) {
      throw new NotFoundException();
    }

    const listFiles = await readdir(entirePath);

    const list: File[] = await Promise.all(
      listFiles.map(async (file) => {
        const filePath = join(entirePath, file);
        const fileStat = await lstat(filePath, { bigint: false });
        const tokens = await this.tokenServ.getCountByPath(join(path, file));
        if (fileStat.isDirectory()) {
          const folderSize = await this.getUsedSpaceFolder(join(path, file), userPayload);
          return {
            name: file,
            type: 'folder',
            size: folderSize,
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

  async getFileP(path: string, userPayload: UserPayload): Promise<File | null> {
    const { userId } = userPayload;
    const entirePath = join(this.root, userId, path);
    if (!(await this.existsEP(entirePath))) return null;
    const fileName = entirePath.split('/').pop();
    const state = await lstat(entirePath);
    return {
      name: fileName,
      type: state.isDirectory() ? 'folder' : 'file',
      size: state.size,
      extension: fileName.split('.').pop(),
      mime_type: lookup(fileName.split('.').pop()) || '',
      tokens: await this.tokenServ.getCountByPath(path)
    };
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
    if (!(await this.exists(path, userPayload))) {
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
    if (await this.existsEP(`${entirePath}`)) {
      throw new BadRequestException('File already exists');
    }
    const writeStream = createWriteStream(`${entirePath}`);
    writeStream.write(file.buffer);
    writeStream.close();
    const pathArr = path.split('/');
    pathArr.pop();
    const pathH = pathArr.join('/');
    this.system.emitChangeFileEvent({ userId, path: pathH });
    this.system.emitFileUploadRequest(userId);
    this.addUserIndexUpdateSchedule(userId);
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

    if (!(await this.existsEP(entirePath))) {
      throw new NotFoundException();
    }
    if (!(await lstat(entirePath)).isDirectory()) {
      await rm(entirePath);
      const pathArr = path.split('/');
      pathArr.pop();
      const pathH = pathArr.join('/');
      this.system.emitChangeFileEvent({ path: pathH, userId: userPayload.userId });
      return Promise.resolve({ message: 'File deleted successfully' });
    }
    await rm(entirePath, { recursive: true });
    this.tokenServ.deleteTokensByPath(path, userId);
    const pathArr = path.split('/');
    pathArr.pop();
    const pathH = pathArr.join('/');
    this.system.emitChangeFileEvent({ path: pathH, userId: userPayload.userId });
    return { message: 'Folder deleted successfully' };
  }

  async deleteFiles(path: string, files: string[], userPayload: UserPayload) {
    const delFiles = files.map((file) => {
      const pathFile = join(path, file);
      this.deleteFile(pathFile, userPayload);
    });
    return { message: 'files deleted', files: files.length };
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
    if (await this.existsEP(entirePath)) {
      throw new BadRequestException('Folder already exists');
    }
    await mkdir(entirePath, { recursive: true });
    const pathArr = path.split('/');
    pathArr.pop();
    const pathH = pathArr.join('/');
    this.updateTree(userPayload).then(() => {
      this.system.emitTreeUpdate(userPayload.userId);
    });
    this.system.emitChangeFileEvent({ path: pathH, userId: userPayload.userId });
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
    const showF = showFiles;
    const pathWithUser = userPayload !== null && !rec ? join(this.root, userPayload.userId, path) : join(this.root, path);
    const entirePath = rec ? path : pathWithUser;

    const fileStat = await lstat(entirePath, { bigint: false });
    if (!fileStat.isDirectory()) {
      return showFiles
        ? {
            type: 'file',
            name: path.split('/').pop(),
            extension: path.split('.').pop(),
            tokens: 0,
            mime_type: lookup(path.split('.').pop()) || '',
            size: fileStat.size
          }
        : null;
    }
    const files = await readdir(entirePath);

    const folder: Folder = {
      type: 'Folder',
      name: entirePath.split('/').pop(),
      size: fileStat.size,
      content: await Promise.all(
        files.map(async (f): Promise<File | Folder> => {
          const filePath = join(entirePath, f);
          try {
            const fileStat = await lstat(filePath, { bigint: false });
            if (fileStat.isDirectory()) {
              return {
                type: 'Folder',
                name: f,
                size: fileStat.size,
                content: (
                  await Promise.all(
                    (await readdir(filePath)).map(async (fi) => await this.GenerateTree(join(filePath, fi), userPayload, true, showF))
                  )
                ).filter((f) => f !== null)
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
            return null;
          } catch (err) {
            console.error('tree Error: ', err);
            return null;
          }
        })
      )
    };
    return folder;
  }


  /**
   * Actualizar todos los arboles de los usuarios
   */
  async updateAllTrees() {
    const users = await this.usersService.findAll();
    for (const user of users) {
      await this.updateTree({ userId: user.id, username: user.username, isadmin: false });
    }
    return { message: 'arobles actualizados' };
  }

  /**
   * Obtener el Arbol completo por cache
   * @param userPayload
   * @returns {Folder | File} tree
   */
  async GetTreeC(userPayload: UserPayload) {
    const { userId } = userPayload;
    const treeC = await this.treeService.getTreeCache(userId);
    if (treeC === null) {
      const tree = await this.GenerateTree('', userPayload, false, true);
      this.treeService.setTreeCache(userId, tree);
      return tree;
    }
    return treeC;
  }

  /**
   * actualizar el cache en caso de una modificacion de un directorio
   * @param {UserPayload} userPayload
   */
  async updateTree(userPayload: UserPayload) {
    const { userId } = userPayload;
    const tree = await this.GenerateTree('', userPayload, false, true);
    return await this.treeService.setTreeCache(userId, tree);
  }

  /**
   * Obtener El espacio usado
   * @returns {Promise<number>} Espacio usado en Bytes
   */
  async getUsedSpace(): Promise<number> {
    const filesTree = await this.GenerateTree('', null, false, true);
    const usedSpace = { value: 0 };
    if (filesTree.type === 'Folder') {
      const onForEach = (file: File | Folder) => {
        try {
          if (file.type === 'Folder') {
            usedSpace.value = usedSpace.value + file.size;
            file.content.forEach(onForEach);
          }
          if (file.type === 'file') {
            usedSpace.value = usedSpace.value + file.size;
          }
        } catch (err) {}
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
    const filesTree = await this.GetTreeC({ isadmin: false, username: '', userId });
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
   * @param {string} path id de usuario
   * @param {UserPayload} user usuario de usuario autenticado
   * @returns {Promise<number>} espacio usado por el usuario
   */
  async getUsedSpaceFolder(path: string, user: UserPayload): Promise<number> {
    if (!this.exists('', user)) return 0;
    const filesTree = await this.GenerateTree(path, user, false);
    const usedSpace = { value: 0 };
    if (filesTree.type === 'Folder') {
      const onForEach = (file: File | Folder) => {
        if (file.type === 'Folder') {
          usedSpace.value = usedSpace.value + file.size;
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

  async moveFileFolder(path: string, newPath: string, userPayload: UserPayload): Promise<MessageResponse> {
    const { userId } = userPayload;
    const realPath = join(this.root, userId, path);
    const realPathNew = join(this.root, userId, newPath);
    if (await this.exists(newPath, userPayload)) {
      throw new UnauthorizedException('file/folder already exists');
    }
    await rename(realPath, realPathNew);
    await this.tokenServ.updatePathTokens(path, newPath);
    const pathMessage = path.split('/');
    pathMessage.pop();
    this.system.emitChangeFileEvent({ path: pathMessage.join('/'), userId: userPayload.userId });
    this.updateTree(userPayload).then(() => {
      this.system.emitTreeUpdate(userPayload.userId);
    });
    return { message: 'move success' };
  }

  async moveFiles(path: string, newPath: string, files: string[], userPayload: UserPayload) {
    const { userId } = userPayload;
    const realPath = join(this.root, userId, path);
    const realPathNew = join(this.root, userId, newPath);
    const realPathIsDirectory = (await lstat(realPath)).isDirectory();
    const realPathNewIsDirectory = (await lstat(realPathNew)).isDirectory();
    if (!realPathIsDirectory || !realPathNewIsDirectory) {
      throw new BadRequestException('path or new Path is not a directory');
    }
    await Promise.all(
      files.map(async (f) => {
        const filePath = join(realPath, f);
        const newFilePath = join(realPathNew, f);
        if (await this.existsEP(filePath)) {
          await rename(filePath, newFilePath);
          this.system.emitChangeFileEvent({ path, userId: userPayload.userId });
        }
        return f;
      })
    );
    this.updateTree(userPayload).then(() => {
      this.system.emitTreeUpdate(userPayload.userId);
    });
    this.system.emitChangeFileEvent({ path, userId: userPayload.userId });
    return { message: 'archivos movidos' };
  }

  async renameFile(path: string, newName: string, userPayload: UserPayload) {
    const { userId } = userPayload;
    const newPath = path.split('/');
    newPath.pop();
    newPath.push(newName);
    const realPath = join(this.root, userId, path);
    const realNewPath = join(this.root, userId, newPath.join('/'));
    await rename(realPath, realNewPath);
    const pathMessage = path.split('/');
    pathMessage.pop();
    this.system.emitChangeFileEvent({ path: pathMessage.join('/'), userId: userPayload.userId });
    this.updateTree(userPayload).then(() => {
      this.system.emitTreeUpdate(userPayload.userId);
    });
    return { message: 'archivo renombradostatFile' };
  }

  async getUsedSpaceByFileType(userId = ''): Promise<UsedSpaceType[]> {
    const usedSpace: Record<string, number> = {};
    const sumBytes = (type: string, bytes: number) => {
      if (usedSpace[type] === undefined) {
        usedSpace[type] = bytes;
      } else {
        usedSpace[type] += bytes;
      }
    };
    const filesTree = await this.treeService.getTree(userId);
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
          } else if (file.mime_type.includes('audio/')) {
            sumBytes('audio', file.size);
          } else if (file.mime_type.includes('pdf')) {
            sumBytes('pdf', file.size);
          } else if (file.mime_type.includes('7z')) {
            sumBytes('7zip', file.size);
          } else if (file.mime_type.includes('zip')) {
            sumBytes('zip', file.size);
          } else if (file.mime_type.includes('gzip')) {
            sumBytes('gzip', file.size);
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

  async getZipFromPathUser(path: string, user: UserPayload | null): Promise<any> {
    const filename = path.split('/').pop();
    const entirePath = user === null ? join(this.root, path) : join(this.root, user.userId, path);
    if (!(await this.existsEP(entirePath))) {
      throw new NotFoundException('File or Folder Not Found');
    }
    const fileStatus = await lstat(entirePath);
    if (fileStatus.isDirectory()) {
      const treeF = await this.GenerateTree(path, user, false);
      const zipFolder = new JSZip();
      const onForEach = (pathContext: string) => (val: Folder | File) => {
        if (val.type === 'Folder') {
          val.content.forEach(onForEach(join(pathContext, val.name)));
        } else {
          const realPath = join(entirePath, pathContext, val.name);
          const zipPath = join(filename, pathContext, val.name);
          zipFolder.file(zipPath, createReadStream(realPath), { createFolders: true });
        }
      };
      if (treeF.type === 'Folder') {
        treeF.content.forEach(onForEach(''));
        return zipFolder.generateNodeStream({ streamFiles: true });
      }
    } else {
      const zipFile = new JSZip();
      zipFile.file(filename, createReadStream(entirePath));
      return zipFile.generateNodeStream({ streamFiles: true });
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
