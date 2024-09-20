/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FileTempResp {
  @ApiProperty()
  @IsString()
  name: string;
  @ApiProperty()
  @IsNumber()
  size: number;
  @ApiProperty()
  @IsNumber()
  received: number;
  @ApiProperty()
  @IsNumber()
  saved: number;
  @ApiProperty()
  @IsBoolean()
  completed: boolean;
  @ApiProperty()
  @IsNumber()
  blobsNum: number;
}
