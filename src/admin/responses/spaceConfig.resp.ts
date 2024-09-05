import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class SpaceConfigResp {
  @ApiProperty({ type: Number })
  @IsNumber()
  dedicatedSpace: number;
  @ApiProperty({ type: String, enum: ['MB', 'GB'] })
  @IsString()
  unitType: 'MB' | 'GB';
  @ApiProperty({ type: Number })
  @IsNumber()
  usedSpaceBytes: number;
}
