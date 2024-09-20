/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserResp {
  @IsString()
  @ApiProperty()
  id: string;
  @IsString()
  @ApiProperty()
  username: string;
  @IsBoolean()
  @ApiProperty({ type: Boolean })
  admin: boolean;
}
