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

interface UsersConfig {
  firstUser: string | null;
}

export interface Config {
  core: CoreConfig;
  users: UsersConfig;
}
