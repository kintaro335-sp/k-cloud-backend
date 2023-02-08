import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  /**
   * Obtener Hola Mundo
   * @returns {string}
   */
  getHello(): string {
    return 'Hello World!';
  }
}
