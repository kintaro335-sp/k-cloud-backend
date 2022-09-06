import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// interfaces
import { Config } from './interfaces/config.interface';
// fs
import { existsSync, createWriteStream, rmSync, readFile } from 'fs';
@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  constructor() {}

  config: Config = {
    core: {
      dedicatedSpace: 1024,
      unitType: 'MB',
      dedicatedSpaceBytes: 1073741824,
      usedSpaceBytes: 0
    }
  };

  parseConfig(configString: string): Config {
    return JSON.parse(configString);
  }

  existsSettingsFile(): boolean {
    return existsSync('./settings.json');
  }

  saveConfig() {
    const stream = JSON.stringify(this.config);
    if (this.existsSettingsFile()) {
      rmSync('./settings.json');
    }
    const file = createWriteStream('./settings.json');
    file.write(Buffer.from(stream));
    file.close();
  }

  loadConfig() {
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

  onModuleDestroy() {}
}
