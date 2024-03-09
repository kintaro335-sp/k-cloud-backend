import { Injectable } from '@nestjs/common';
import { IndexList } from 'src/treefiles/interfaces/indexelement.interface';
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
      .filter((v) => v !== 'id')
      .map((key) => path[key])
      .join('/')
      .replace('../', '');
    if (pathString === '/') {
      return '';
    }
    return pathString;
  }

  quickSort(arr: IndexList) {
    if (arr.length <= 1) {
      return arr;
    }

    let pivot = arr[0];
    let leftArr = [];
    let rightArr = [];

    for (let i = 1; i < arr.length; i++) {
      if (arr[i].path < pivot.path) {
        leftArr.push(arr[i]);
      } else {
        rightArr.push(arr[i]);
      }
    }

    return [...this.quickSort(leftArr), pivot, ...this.quickSort(rightArr)];
  }
}
