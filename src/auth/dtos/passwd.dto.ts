/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswdDTO {
  @IsString()
  @ApiProperty()
  password: string;
  @IsString()
  @ApiProperty()
  newPassword: string;
}
