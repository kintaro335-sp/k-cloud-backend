import { Injectable } from '@nestjs/common';
import { FilesEventEmitter } from './eventemitter/filesEventEmitter';
import { ChangeFileData } from './interfaces/changefile.interface';
import { ChangeTokenEvent } from './interfaces/changetoken.interface'

@Injectable()
export class SystemService {
  private fileEmitter = new FilesEventEmitter();

  //tokens event
  emitChangeTokenEvent(collection: ChangeTokenEvent) {
    this.fileEmitter.emit('token-change', collection);
  }

  addChangeTokenListener(listener: (collection: ChangeTokenEvent) => void) {
    this.fileEmitter.addListener('token-change', listener);
  }

  // files change
  emitChangeFileEvent(collection: ChangeFileData) {
    this.fileEmitter.emit('file-change', collection);
  }

  addChangeFileListener(listener: (collection: ChangeFileData) => void) {
    this.fileEmitter.addListener('file-change', listener);
  }
}
