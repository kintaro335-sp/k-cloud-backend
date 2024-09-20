/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IndexElementResponse {
  @ApiProperty()
  @IsString()
  name: string;
  @ApiProperty()
  @IsString()
  path: string;
  @ApiProperty()
  @IsNumber()
  size: number;
  @ApiProperty()
  @IsString()
  mime_type: string
}
