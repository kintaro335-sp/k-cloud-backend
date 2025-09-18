/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { IsNumber } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class FileInitDTO {
  @IsNumber()
  @ApiProperty()
  size: number;
}
