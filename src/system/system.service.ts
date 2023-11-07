import { Injectable } from '@nestjs/common';
import { EventEmitterWS } from './eventemitter/filesEventEmitter';
import { ChangeFileData } from './interfaces/changefile.interface';
import { ChangeTokenEvent } from './interfaces/changetoken.interface';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SystemService {
  private eventEmitterWS = new EventEmitterWS();

  @Cron(CronExpression.EVERY_5_MINUTES)
  private emitEvents() {
    this.emitChangeStatsUpdates();
  }

  // users
  emitChangeUsersUpdates() {
    this.eventEmitterWS.emit('users-update');
  }

  addChangeUsersUpdate(listener: () => void) {
    this.eventEmitterWS.addListener('users-update', listener);
  }

  // stats
  emitChangeStatsUpdates() {
    this.eventEmitterWS.emit('stats-update');
  }

  addChangeStatsUpdate(listener: () => void) {
    this.eventEmitterWS.addListener('stats-update', listener);
  }

  // memory monitor
  emitChangeMemoryMonitorEvent() {
    this.eventEmitterWS.emit('memory-usage-update');
  }

  addChangeMemoryMonitorListener(listener: () => void) {
    this.eventEmitterWS.addListener('memory-usage-update', listener);
  }

  //tokens event
  emitChangeTokenEvent(collection: ChangeTokenEvent) {
    this.eventEmitterWS.emit('token-change', collection);
  }

  addChangeTokenListener(listener: (collection: ChangeTokenEvent) => void) {
    this.eventEmitterWS.addListener('token-change', listener);
  }

  // files change
  emitChangeFileEvent(collection: ChangeFileData) {
    this.eventEmitterWS.emit('file-change', collection);
  }

  addChangeFileListener(listener: (collection: ChangeFileData) => void) {
    this.eventEmitterWS.addListener('file-change', listener);
  }
}