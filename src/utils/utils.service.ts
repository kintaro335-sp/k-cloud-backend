import { Injectable } from '@nestjs/common';
// uniqid
import { v1 } from 'uuid';

@Injectable()
export class UtilsService {
  base64ToBuffer(base64: string): Buffer {
    return Buffer.from(base64, 'base64');
  }

  arraySum(numbers: number[]) {
    let result = 0;
    numbers.forEach((n) => {
      result += n;
    });
    return result;
  }

  createIDSF(): string {
    return v1();
  }

  processPath(path: Record<any, string>) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .filter((v) => v !== 'id')
      .join('/')
      .replace('../', '');
    console.log(pathString);
    if (pathString === '/') {
      return '';
    }
    return pathString;
  }
}
