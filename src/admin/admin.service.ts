import { Injectable, OnModuleInit, OnModuleDestroy, forwardRef, Inject } from '@nestjs/common';
// services
import { FilesService } from '../files/files.service';
// interfaces
import { SpaceUsed } from './interfaces/spaceused.interface';
import { Config, UnitByte, SpaceConfig } from './interfaces/config.interface';
// fs
import { existsSync, createWriteStream, rmSync, readFile } from 'fs';
@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(forwardRef(() => FilesService)) private readonly fileServ: FilesService) {}

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
    return existsSync('./settings.json');
  }

  /**
   * Guardar settings.json
   */
  private saveConfig(): void {
    const stream = JSON.stringify(this.config);
    if (this.existsSettingsFile()) {
      rmSync('./settings.json');
    }
    const file = createWriteStream('./settings.json');
    file.write(Buffer.from(stream));
    file.close();
  }

  /**
   * Cargar settings.json
   */
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

    this.config.core.usedSpaceBytes = usedSpaceBytes;

    this.saveConfig();

    return { total: this.config.core.dedicatedSpaceBytes, used: usedSpaceBytes };
  }

  /**
   * Obtener espacio usado
   * @returns {Promise<SpaceUsed>}
   */
  getUsedSpace() {
    return { total: this.config.core.dedicatedSpaceBytes, used: this.config.core.usedSpaceBytes };
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
    this.config.users.firstUser = userid;
    this.saveConfig();
  }

  getfirstUser(): string | null {
    return this.config.users.firstUser
  }
}
