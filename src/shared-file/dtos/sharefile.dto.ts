/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShareFileDTO {
  @IsBoolean()
  @ApiProperty({ type: Boolean })
  expires: boolean;
  @IsBoolean()
  @ApiProperty({ type: Boolean })
  public: boolean;
  @IsNumber()
  @ApiProperty({ type: Number })
  expire: number;
}
