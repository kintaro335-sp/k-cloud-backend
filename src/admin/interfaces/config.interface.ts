export type UnitByte = 'MB' | 'GB';

export type Categorie = 'core';
interface CoreConfig {
  dedicatedSpace: number;
  unitType: UnitByte;
  dedicatedSpaceBytes: number;
  usedSpaceBytes: number;
}

export interface SpaceConfig {
  dedicatedSpace: number;
  unitType: UnitByte;
}

export interface Config {
  core: CoreConfig;
}
