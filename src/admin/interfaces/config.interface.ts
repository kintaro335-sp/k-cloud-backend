

export type UnitByte = 'MB' | 'GB';

export type Categorie = 'core';
interface CoreConfig  {
  dedicatedSpace: number
  unitType: UnitByte
  dedicatedSpaceBytes: bigint
  usedSpaceBytes: bigint
}

export interface Config {
  core: CoreConfig
}
