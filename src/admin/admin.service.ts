import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// services
import { FilesService } from '../files/files.service';
// interfaces
import { Config, UnitByte } from './interfaces/config.interface';
// fs
import { existsSync, createWriteStream, rmSync, readFile } from 'fs';
@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly fileServ: FilesService) {}

  private config: Config = {
    core: {
      dedicatedSpace: 1024,
      unitType: 'MB',
      dedicatedSpaceBytes: BigInt(1073741824),
      usedSpaceBytes: BigInt(0)
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

  async updateUsedSpace() {
    const usedSpaceBytes = await this.fileServ.getUsedSpace();

    this.config.core.usedSpaceBytes = usedSpaceBytes;

    this.saveConfig();

    return { total: this.config.core.dedicatedSpaceBytes, used: usedSpaceBytes };
  }

  async getUsedSpace() {
    return { total: this.config.core.dedicatedSpaceBytes, used: this.config.core.usedSpaceBytes };
  }

  // convertions

  private convertMBtoBytes(megasbytes: number): bigint {
    return BigInt(megasbytes * 1048576);
  }

  private convertGBtoBytes(gigaBytes: number): bigint {
    return BigInt(gigaBytes * 1073741824);
  }
}
