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
}
