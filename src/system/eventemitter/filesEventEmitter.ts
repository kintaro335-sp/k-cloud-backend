import { EventEmitter } from 'events';
import { ChangeFileData } from '../interfaces/changefile.interface';

export declare interface FilesEventEmitter {
  on(event: 'file-change', listener: (collection: ChangeFileData) => void);
}

export class FilesEventEmitter extends EventEmitter {
  constructor() {
    super();
  }
}
