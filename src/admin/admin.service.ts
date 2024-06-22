import { Injectable, OnModuleInit, OnModuleDestroy, forwardRef, Inject, BadRequestException } from '@nestjs/common';
// services
import { FilesService } from '../files/files.service';
import { UsersService } from '../users/users.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
// interfaces
import { SpaceUsed, UsedSpaceUser } from './interfaces/spaceused.interface';
import { Config, UnitByte, SpaceConfig } from './interfaces/config.interface';
// fs
import { existsSync, createWriteStream, rmSync, readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(forwardRef(() => FilesService)) private readonly fileServ: FilesService,
    private readonly usersServ: UsersService,
    private readonly configServ: ConfigService
  ) {
    const pathConfEnv = this.configServ.get('SETTINGS');

    if (pathConfEnv !== '' || pathConfEnv !== undefined) {
      this.pathConfig = pathConfEnv;
    } else {
      this.pathConfig = join(__dirname, 'settings.json');
    }
  }

  private pathConfig = '';

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

  @Cron(CronExpression.EVERY_12_HOURS)
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
    return existsSync(this.pathConfig);
  }

  /**
   * Guardar settings.json
   */
  private saveConfig(): void {
    const stream = JSON.stringify(this.config);
    const file = createWriteStream(this.pathConfig, { flags: 'w' });
    file.write(Buffer.from(stream));
    file.close();
  }

  /**
   * Cargar settings.json
   */
  private loadConfig() {
    if (this.existsSettingsFile()) {
      try {
        const data = readFileSync(this.pathConfig);
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
    if (unitType === 'MB') {
      const dedicatedSpace = quantity;
      const dedicatedSpaceBytes = this.convertMBtoBytes(quantity);
      if (this.config.core.usedSpaceBytes > dedicatedSpaceBytes) {
        throw new BadRequestException('El espacio usado es mayor que el espacio dedicado');
      }
      this.config.core.unitType = unitType;
      this.config.core.dedicatedSpace = dedicatedSpace;
      this.config.core.dedicatedSpaceBytes = dedicatedSpaceBytes;
    }
    if (unitType === 'GB') {
      const dedicatedSpace = quantity;
      const dedicatedSpaceBytes = this.convertGBtoBytes(quantity);
      if (this.config.core.usedSpaceBytes > dedicatedSpaceBytes) {
        throw new BadRequestException('El espacio usado es mayor que el espacio dedicado');
      }
      this.config.core.unitType = unitType;
      this.config.core.dedicatedSpace = dedicatedSpace;
      this.config.core.dedicatedSpaceBytes = dedicatedSpaceBytes;
    }
    this.saveConfig();
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

  getOwner(): string | null {
    return this.config?.users?.firstUser || null;
  }

  changeOwner(userId: string) {
    this.config.users.firstUser = userId;
    this.saveConfig();
  }

  getMemoryUsage() {
    return process.memoryUsage.rss();
  }

  getBufferUsage() {
    return process.memoryUsage().arrayBuffers;
  }
}
