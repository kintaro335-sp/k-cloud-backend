import { EventEmitter } from 'events';
import { ChangeFileData } from '../interfaces/changefile.interface';
import { ChangeTokenEvent } from '../interfaces/changetoken.interface';

export declare interface EventEmitterWS extends EventEmitter {
  on(event: 'file-change', listener: (collection: ChangeFileData) => void);
  on(event: 'token-change', listener: (collection: ChangeTokenEvent) => void);
  on(event: 'memory-usage-update', listener: () => void);
  on(event: 'stats-update', listener: () => void);
}

export class EventEmitterWS extends EventEmitter {
  constructor() {
    super();
  }
}
