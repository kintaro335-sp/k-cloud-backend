import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { time } from 'uniqid';

@Injectable()
export class CryptoService {
  createPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hashedPassword}`;
  }

  comparePasswords(passwordInput: string, passwordDB: string): boolean {
    if (Boolean(passwordInput) && Boolean(passwordDB)) {
      const [salt, key] = passwordDB.split(':');
      const hashedBuffer = scryptSync(passwordInput, salt, 64);

      const keyBuffer = Buffer.from(key, 'hex');

      return timingSafeEqual(hashedBuffer, keyBuffer);
    }
    return false;
  }

  createUserId(username: string) {
    return `${username}-${time()}`;
  }
}
