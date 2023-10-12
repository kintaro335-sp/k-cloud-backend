import { EventEmitter } from 'events';
import { ChangeFileData } from '../interfaces/changefile.interface';
import { ChangeTokenEvent } from '../interfaces/changetoken.interface';

export declare interface FilesEventEmitter {
  on(event: 'file-change', listener: (collection: ChangeFileData) => void);
  on(event: 'token-change', listener: (collection: ChangeTokenEvent) => void);
}

export class FilesEventEmitter extends EventEmitter {
  constructor() {
    super();
  }
}
