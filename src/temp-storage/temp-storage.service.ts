import { Injectable } from '@nestjs/common';
import { UtilsService } from '../utils/utils.service';
import { ConfigService } from '@nestjs/config';
// interfaces
import { FilePTemp, BlobFTemp, FilePTempResponse } from './interfaces/filep.interface';
import { createWriteStream, existsSync } from 'fs';
import { UserPayload } from 'src/auth/interfaces/userPayload.interface';

@Injectable()
export class TempStorageService {
  constructor(private readonly utilsService: UtilsService, private readonly configServ: ConfigService) {
    try {
      const newFnumber = Number(configServ.get('FILES_ATST'));
      this.filesAtSameTime = isNaN(newFnumber) ? 1 : newFnumber;
    } catch (err) {}
  }
  private filesAtSameTime = 1;
  private filesWritting = 0;
  private filesDirectories: string[] = [];
  private storage: Record<string, FilePTemp | null> = {};

  private calculateWritting() {
    let count = 0;
    this.filesDirectories.forEach((d) => {
      const f = this.storage[d];
      if (f === undefined) return;
      f.writting ? count++ : null;
    });
    this.filesWritting = count;
  }

  /**
   * Saber si escribir mas archivos al mismo tiempo
   * @returns {boolean}
   */
  allowWriteMoreFiles() {
    this.calculateWritting()
    return this.filesWritting <= this.filesAtSameTime;
  }

  /**
   * obtener la cantidad de blob obtenidos
   * @param {string} path direccion del archivo
   * @returns {number} cantidad de blobs
   */
  getBlobsLength(path: string): number {
    if (this.storage[path] === null || this.storage[path] === undefined) {
      return 0;
    }

    return this.storage[path].blobs.length;
  }

  /**
   * Obtener los archivos activos
   * @returns {string[]}
   */
  getFilesDirectories() {
    return this.filesDirectories;
  }

  /**
   * Actualizar lo Bytes Escritos
   * @param {string} path direccion de archivo
   * @param {BlobFTemp} blob blob escrito
   */
  updateBytesWriten(path: string, blob: BlobFTemp) {
    this.storage[path].bytesWritten.push({ from: blob.position, to: blob.position + blob.blob.length });
    const total = this.storage[path].bytesWritten.map((b) => b.to - b.from);
    this.storage[path].saved = this.utilsService.arraySum(total);
  }

  /**
   * Inicializar un Archivo para cargarlo en RAM
   * @param {string} realPath Direccion real del archivo
   * @param {number} size Tamaño del archivo en Bytes
   * @param {UserPayload} user usuario
   * @param [string] path direccion que llega desde params
   */
  createFileTemp(realPath: string, size: number, user: UserPayload, path: string) {
    const name = realPath.split('/').pop();

    this.filesDirectories.push(realPath);
    this.storage[realPath] = {
      name,
      size,
      saved: 0,
      received: 0,
      bytesWritten: [],
      completed: false,
      blobs: [],
      writting: false,
      path,
      userId: user.userId
    };
  }

  writeBlob(path: string, blob: BlobFTemp): Promise<void> {
    if (existsSync(path)) {
      const writeStream = createWriteStream(path, { start: blob.position, flags: 'r+', autoClose: true });
      return new Promise((res) => {
        if (!writeStream.write(blob.blob)) {
          writeStream.on('drain', () => {
            res();
          });
        } else {
          process.nextTick(() => {
            res();
          });
        }
      });
    } else {
      const writeStream = createWriteStream(path, { start: blob.position, flags: 'w', autoClose: true });
      return new Promise((res) => {
        if (!writeStream.write(blob.blob)) {
          writeStream.on('drain', () => {
            res();
          });
        } else {
          process.nextTick(() => {
            res();
          });
        }
      });
    }
  }

  /**
   * Veririfcar si esta completo
   * @param {string} path direccion del archivo
   */
  isCompleted(path: string) {
    const file = this.storage[path];
    if (file === null || file === undefined) {
      return true;
    }
    const isCompleted = file.size === file.saved || file.size < file.saved;
    this.storage[path].completed = isCompleted;
    return isCompleted;
  }

  /**
   * Eliminar archivo (esto es al terminar de subir el archivo)
   * @param {string} path Direccion del archivo
   */
  delFile(path: string) {
    this.filesDirectories = this.filesDirectories.filter((dirs) => dirs !== path);
    delete this.storage[path];
  }

  /**
   * comprobar si existe un Archivo alojado
   * @param path direccion del archivo
   * @returns {boolean}  `true` si existe
   */
  existsFile(path: string): boolean {
    return Boolean(this.storage[path]);
  }

  /**
   *
   */
  getFileStatus(path: string): FilePTempResponse {
    const { name, completed, received, saved, size, blobs } = this.storage[path];
    return {
      name,
      completed,
      received,
      saved,
      size,
      blobsNum: blobs.length
    };
  }

  /**
   * Alojar un Blob en Buffer en un arvhivo
   * @param path
   * @param position
   * @param blob
   */
  allocateBlob(path: string, position: number, blob: Buffer) {
    this.storage[path].blobs.unshift({ position, blob });
    this.storage[path].received += blob.length;
  }

  /**
   * obtener el ultimo blob
   * @param path direccion del archivo
   * @returns {BlobFTemp} Buffer a escribir
   */
  deallocateBlob(path: string): BlobFTemp {
    try {
      const blobR = this.storage[path].blobs.pop();
      return blobR;
    } catch (err) {
      return;
    }
  }

  /**
   * Obtiene cuanto bytes han sido escritos
   * @param path Path del archivo
   * @returns Numero de Bytes
   */
  private getBytesWritten(path: string): number {
    let size = 0;
    this.storage[path].bytesWritten.forEach((binfo, i) => {
      size += binfo.to - binfo.from;
    });
    return size;
  }

  setWritting(path: string, newValue: boolean) {
    if (this.storage[path] === null || this.storage[path] === undefined) return;
    newValue ? this.filesWritting++ : this.filesWritting--;
    this.storage[path].writting = newValue;
    // this.calculateWritting();
  }

  getWritting(path: string): boolean {
    if (this.storage[path] === null || this.storage[path] === undefined) return false;

    return this.storage[path].writting;
  }

  getFileInfo(path: string) {
    return this.storage[path];
  }

  getSpaceToUse(): number {
    let nonWrittenBytes = 0;
    this.filesDirectories.forEach((dir) => {
      const file = this.storage[dir];
      if (file !== undefined || file !== null) {
        const bytesToWrite = file.size;
        nonWrittenBytes += bytesToWrite;
      }
    });
    return nonWrittenBytes;
  }
}
