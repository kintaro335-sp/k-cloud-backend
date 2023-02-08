import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { time } from 'uniqid';

/**
 * @class Servicio de Criptografia
 */
@Injectable()
export class CryptoService {

  /**
   * Cifrar la Contraseña y con una Salt
   * @param {string} password Contraseña en texto plano
   * @returns {string}      Contraseña encriptada
   */
  createPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hashedPassword}`;
  }

  /**
   * Verificar si Dos contraseñas son iguales;
   * comparando una en texto plano y 
   * con una encriptada con @function createPassword
   * @param passwordInput Password de texto plano
   * @param passwordDB Password encriptada
   * @returns {boolean}      `true` en caso de ser iguales
   */
  comparePasswords(passwordInput: string, passwordDB: string): boolean {
    if (Boolean(passwordInput) && Boolean(passwordDB)) {
      const [salt, key] = passwordDB.split(':');
      const hashedBuffer = scryptSync(passwordInput, salt, 64);

      const keyBuffer = Buffer.from(key, 'hex');

      return timingSafeEqual(hashedBuffer, keyBuffer);
    }
    return false;
  }

  /**
   * Crear un Id semi-aleatorio a partir de un nombre
   * @param {string} username Nombre de un usuario
   * @returns {string} un id @example "kintaro-xwarr5"
   */
  createUserId(username: string) {
    return `${username}-${time()}`;
  }
}
