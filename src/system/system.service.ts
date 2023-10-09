import { Injectable } from '@nestjs/common';
import { FilesEventEmitter } from './eventemitter/filesEventEmitter';
import { ChangeFileData } from './interfaces/changefile.interface';

@Injectable()
export class SystemService {
  private fileEmitter = new FilesEventEmitter();

  emitChangeFileEvent(collection: ChangeFileData) {
    this.fileEmitter.emit('file-change', collection);
  }

  addChangeFileListener(listener: (collection: ChangeFileData) => void) {
    this.fileEmitter.addListener('file-change', listener);
  }
}
