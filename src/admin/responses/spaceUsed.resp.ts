/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SpaceUsedResp {
  @ApiProperty({ type: Number })
  @IsNumber()
  total: number;
  @ApiProperty({ type: Number })
  @IsNumber()
  used: number;
}
