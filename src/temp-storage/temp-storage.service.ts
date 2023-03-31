import { Injectable } from '@nestjs/common';
import { UtilsService } from '../utils/utils.service';
// interfaces
import { FilePTemp, BlobFTemp, FilePTempResponse } from './interfaces/filep.interface';
import { createWriteStream, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class TempStorageService {
  constructor(private readonly utilsService: UtilsService) {}

  private filesDirectories: string[] = [];
  private storage: Record<string, FilePTemp | null> = {};

  /**
   * obtener la cantidad de blob obtenidos
   * @param {string} path direccion del archivo
   * @returns {number} cantidad de blobs
   */
  getBlobsLength(path: string): number {
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
   * @param {string} path Direccion del archivo
   * @param {number} size Tamaño del archivo en Bytes
   * @param {string} root raiz
   */
  createFileTemp(path: string, size: number, root: string) {
    const name = path.split('/').pop();

    this.filesDirectories.push(path);
    this.storage[path] = {
      name,
      size,
      saved: 0,
      received: 0,
      bytesWritten: [],
      completed: false,
      blobs: [],
      writting: false
    };
  }

  writeBlob(path: string, blob: BlobFTemp): Promise<void> {
    if (existsSync(path)) {
      const writeStream = createWriteStream(path, { start: blob.position, flags: 'r+', autoClose: true });
      return new Promise((res) => {
        if (!writeStream.write(blob.blob)) {
          writeStream.once('drain', () => {
            res();
          });
        } else {
          res();
        }
      });
    } else {
      const writeStream = createWriteStream(path, { start: blob.position, flags: 'w', autoClose: true });
      return new Promise((res) => {
        if (!writeStream.write(blob.blob)) {
          writeStream.once('drain', () => {
            res();
          });
        } else {
          res();
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
    this.storage[path] = null;
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
    const { name, bytesWritten, completed, received, saved, size, blobs } = this.storage[path];
    return {
      name,
      bytesWritten,
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
    const blobR = this.storage[path].blobs.pop();
    return blobR;
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
    this.storage[path].writting = newValue;
  }

  getWritting(path: string): boolean {
    return this.storage[path].writting;
  }
}
