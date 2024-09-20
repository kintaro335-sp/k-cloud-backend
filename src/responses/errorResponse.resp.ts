/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponse {
  @ApiProperty()
  @IsString()
  message: string;
  @ApiProperty()
  @IsNumber()
  code: number;
}
