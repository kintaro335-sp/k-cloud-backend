/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { IsNumber, IsPositive } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class FileInitDTO {
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  size: number;
}
