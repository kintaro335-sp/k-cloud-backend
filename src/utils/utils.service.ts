/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
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
    return orderBy(arr, ['lowercase_name'], ['asc']);
  }

  parseSearchCriteria(search: string) {
    let searchR = search;
    while (searchR.includes(',')) {
      searchR = searchR.replace(',', '|');
    }
    while (searchR.includes('*')) {
      searchR = searchR.replace('*', '[A-Za-z0-9_=. -]+');
    }

    return searchR;
  }

  getVideoHeaders(fileSize: number, range: string) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    return {
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4'
      },
      start,
      end
    };
  }
}
