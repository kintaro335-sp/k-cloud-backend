/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsNumber, IsBoolean, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShareFilesDTO {
  @IsBoolean()
  @ApiProperty({ type: Boolean })
  expires: boolean;
  @IsBoolean()
  @ApiProperty({ type: Boolean })
  public: boolean;
  @IsNumber()
  @ApiProperty({ type: Number })
  expire: number;
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  files: string[];
}
