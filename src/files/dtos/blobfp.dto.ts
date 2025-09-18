/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { IsString, IsBase64, IsNumber } from 'class-validator';

export class BlobFPDTO {
  @IsNumber()
  position: number;
  @IsBase64()
  @IsString()
  blob: string;
}
