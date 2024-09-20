/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MemoryUsageResponse {
  @IsNumber()
  @ApiProperty()
  usage: number;
}
