import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// interfaces
import { Config, UnitByte } from './interfaces/config.interface';
// fs
import { existsSync, createWriteStream, rmSync, readFile } from 'fs';
@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  constructor() {}

  private config: Config = {
    core: {
      dedicatedSpace: 1024,
      unitType: 'MB',
      dedicatedSpaceBytes: 1073741824,
      usedSpaceBytes: 0
    }
  };

  private parseConfig(configString: string): Config {
    return JSON.parse(configString);
  }

  existsSettingsFile(): boolean {
    return existsSync('./settings.json');
  }

  private saveConfig() {
    const stream = JSON.stringify(this.config);
    if (this.existsSettingsFile()) {
      rmSync('./settings.json');
    }
    const file = createWriteStream('./settings.json');
    file.write(Buffer.from(stream));
    file.close();
  }

  private loadConfig() {
    if (this.existsSettingsFile()) {
      readFile('./settings.json', (err, data) => {
        if (err) {
          console.error(err);
        }
        const configString = data.toString();
        this.config = this.parseConfig(configString);
      });
    }
  }

  onModuleInit() {
    if (this.existsSettingsFile()) {
      this.loadConfig();
    } else {
      this.saveConfig();
    }
  }

  onModuleDestroy() {
    this.saveConfig();
  }

  setDedicatedSpace(quantity: number, unitType: UnitByte) {
    this.config.core.unitType = unitType;
    if (unitType === 'MB') {
      this.config.core.dedicatedSpace = quantity;
      this.config.core.dedicatedSpaceBytes = this.convertMBtoBytes(quantity);
    }
    if (unitType === 'GB') {
      this.config.core.dedicatedSpace = quantity;
      this.config.core.dedicatedSpaceBytes = this.convertGBtoBytes(quantity);
    }
  }

  setUsedSpace(bytes: number) {
    this.config.core.dedicatedSpace = bytes;
  }

  // convertions

  private convertMBtoBytes(megasbytes: number): number {
    return megasbytes * 1048576;
  }

  private convertGBtoBytes(gigaBytes: number): number {
    return gigaBytes * 1073741824;
  }
}
