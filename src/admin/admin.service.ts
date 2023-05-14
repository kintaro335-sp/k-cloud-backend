import { Injectable, OnModuleInit, OnModuleDestroy, forwardRef, Inject } from '@nestjs/common';
// services
import { FilesService } from '../files/files.service';
import { UsersService } from '../users/users.service';
import { Cron, CronExpression } from '@nestjs/schedule';
// interfaces
import { SpaceUsed, UsedSpaceUser } from './interfaces/spaceused.interface';
import { Config, UnitByte, SpaceConfig } from './interfaces/config.interface';
// fs
import { existsSync, createWriteStream, rmSync, readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(forwardRef(() => FilesService)) private readonly fileServ: FilesService, private readonly usersServ: UsersService) {}

  private config: Config = {
    core: {
      dedicatedSpace: 1024,
      unitType: 'MB',
      dedicatedSpaceBytes: 1073741824,
      usedSpaceBytes: 0
    },
    users: {
      firstUser: null
    }
  };

  @Cron(CronExpression.EVERY_10_MINUTES)
  private async updateUsedSpaceCron() {
    const usedSpaceBytes = await this.fileServ.getUsedSpace();
    if (this.config.core.usedSpaceBytes !== usedSpaceBytes) {
      this.config.core.usedSpaceBytes = usedSpaceBytes;
      this.saveConfig();
    }
  }

  /**
   * Hacer Json Parse a un `string`
   * @private
   * @param configString string de la configuracion
   * @returns {Config}
   */
  private parseConfig(configString: string): Config {
    return JSON.parse(configString);
  }

  /**
   * Verificar si settings.json existe
   * @returns {boolean} `true` si dicho settings.json existe
   */
  existsSettingsFile(): boolean {
    return existsSync(join(__dirname, 'settings.json'));
  }

  /**
   * Guardar settings.json
   */
  private saveConfig(): void {
    const stream = JSON.stringify(this.config);
    if (this.existsSettingsFile()) {
      rmSync(join(__dirname, 'settings.json'));
    }
    const file = createWriteStream(join(__dirname, 'settings.json'));
    file.write(Buffer.from(stream));
    file.close();
  }

  /**
   * Cargar settings.json
   */
  private loadConfig() {
    if (this.existsSettingsFile()) {
      try {
        const data = readFileSync(join(__dirname, 'settings.json'));
        const configString = data.toString();
        this.config = this.parseConfig(configString);
      } catch (err) {
        console.error(err);
      }
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

  /**
   * Cambiar el espacio dedicado
   * @param {number} quantity Numero de MB o GB
   * @param {UnitByte} unitType solo pueder ser `GB` o `MB`
   */
  setDedicatedSpace(quantity: number, unitType: UnitByte): void {
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

  /**
   * Actualizar el espacio usado
   * @returns {Promise<SpaceUsed>}
   */
  async updateUsedSpace(): Promise<SpaceUsed> {
    const usedSpaceBytes = await this.fileServ.getUsedSpace();
    if (this.config.core.usedSpaceBytes !== usedSpaceBytes) {
      this.config.core.usedSpaceBytes = usedSpaceBytes;
      this.saveConfig();
    }

    return { total: this.config.core.dedicatedSpaceBytes, used: usedSpaceBytes };
  }

  /**
   * Obtener espacio usado
   * @returns {Promise<SpaceUsed>}
   */
  getUsedSpace() {
    return { total: this.config.core.dedicatedSpaceBytes, used: this.config.core.usedSpaceBytes };
  }

  async getUsedSpaceByUsers(): Promise<UsedSpaceUser[]> {
    const users = await this.usersServ.findAll();
    const usersSpaceUsed: Array<Promise<UsedSpaceUser>> = users.map(async (u) => ({
      id: u.id,
      username: u.username,
      usedSpace: await this.fileServ.getUsedSpaceUser(u.id)
    }));
    return Promise.all(usersSpaceUsed);
  }

  getUsedSpaceByFileType() {
    return this.fileServ.getUsedSpaceByFileType();
  }

  getSpaceConfig(): SpaceConfig {
    return { unitType: this.config.core.unitType, dedicatedSpace: this.config.core.dedicatedSpace };
  }

  // convertions

  /**
   * Convertir MegaBytes a Bytes
   * @param {number} megasbytes Cantidad de Bytes
   * @returns {number} cantidad en MegaBytes
   */
  private convertMBtoBytes(megasbytes: number): number {
    return megasbytes * 1048576;
  }

  /**
   * Convertitr GigaBytes a Bytes
   * @param {number} gigaBytes
   * @returns {number}  Cantidad en Bytes
   */
  private convertGBtoBytes(gigaBytes: number): number {
    return gigaBytes * 1073741824;
  }

  setFirstUser(userid: string) {
    if (this.config.users === undefined) {
      this.config.users = {
        firstUser: null
      };
    }
    this.config.users.firstUser = userid;
    this.saveConfig();
  }

  getfirstUser(): string | null {
    return this.config?.users?.firstUser || null;
  }

  getMemoryUsage() {
    return process.memoryUsage.rss();
  }

  getBufferUsage() {
    return process.memoryUsage().arrayBuffers;
  }

  getCPUUsage() {
    return process.cpuUsage().user;
  }
}
