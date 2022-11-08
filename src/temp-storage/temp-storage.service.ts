import { Injectable } from '@nestjs/common';
// interfaces
import { FilePTemp, BlobFTemp } from './interfaces/filep.interface';

@Injectable()
export class TempStorageService {
  filesDirectories: string[] = [];
  storage: Record<string, FilePTemp | null> = {};

  /**
   * Inicializar un Archivo para cargarlo en RAM
   * @param {string} path Direccion del archivo
   * @param {number} size Tamaño del archivo en Bytes
   */
  createFileTemp(path: string, size: number) {
    const name = path.split('/').pop();

    this.filesDirectories.push(path);
    this.storage[path] = {
      name,
      size,
      saved: 0,
      completed: false,
      blobs: []
    };
  }

  /**
   * comprobar si existe un Archivo alojado
   * @param path direccion del archivo
   * @returns {boolean}  `true` si existe
   */
  existsFile(path: string): boolean {
    return this.storage[path] !== null || this.storage !== undefined;
  }

  /**
   * Alojar un Blob en Buffer en un arvhivo
   * @param path
   * @param position
   * @param blob
   */
  allocateBlob(path: string, position: number, blob: Buffer) {
    this.storage[path].blobs.unshift({ position, blob });
  }

  /**
   * obtener el ultimo blob
   * @param path direccion del archivo
   * @returns {BlobFTemp} Buffer a escribir
   */
  deallocateBlob(path: string): BlobFTemp {
    return this.storage[path].blobs.pop();
  }
}
