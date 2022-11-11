import { Injectable } from '@nestjs/common';
// interfaces
import { FilePTemp, BlobFTemp } from './interfaces/filep.interface';

@Injectable()
export class TempStorageService {
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
   * @param {number} numBytes numero de bytes a sumar
   */
  updateBytesWriten(path: string, numBytes: number) {
    this.storage[path].size += numBytes;
  }

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
   * Veririfcar si esta completo
   * @param {string} path direccion del archivo
   */
  isCompleted(path: string) {
    if (!this.existsFile(path)) {
      return false;
    }
    const file = this.storage[path];
    const isCompleted = file.size === file.saved;
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
