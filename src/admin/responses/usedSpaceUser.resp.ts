/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UsedSpaceUserResp {
  @IsString()
  @ApiProperty({ type: String })
  id: string;
  @IsString()
  @ApiProperty({ type: String })
  username: string;
  @IsNumber()
  @ApiProperty({ type: Number })
  usedSpace: number;
}
