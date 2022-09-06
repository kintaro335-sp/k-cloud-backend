

type UnitByte = 'MB' | 'GB';

interface CoreConfig  {
  dedicatedSpace: number
  unitType: UnitByte
  dedicatedSpaceBytes: number
  usedSpaceBytes: number
}

export interface Config {
  core: CoreConfig
}
