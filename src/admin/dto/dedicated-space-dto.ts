/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsNumber, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UnitByte } from '../interfaces/config.interface';

export class DedicatedSpaceDTO {
  @IsNumber()
  @ApiProperty({ type: Number })
  quantity: number;
  @IsString()
  @IsEnum({ MB: 'MB', GB: 'GB' })
  @ApiProperty({ type: String, enum: ['MB', 'GB'] })
  unitTipe: UnitByte;
}
