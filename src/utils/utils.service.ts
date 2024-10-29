/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Injectable } from '@nestjs/common';
import { IndexList } from 'src/treefiles/interfaces/indexelement.interface';
// misc
import { v1 } from 'uuid';
import { orderBy } from 'lodash';

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
      .filter((v) => v !== 'id')
      .map((key) => path[key])
      .join('/')
      .replace('../', '');
    if (pathString === '/') {
      return '';
    }
    return pathString;
  }

  quickSort(arr: IndexList): IndexList {
    return orderBy(arr, ['name'], ['asc']);
  }
}
