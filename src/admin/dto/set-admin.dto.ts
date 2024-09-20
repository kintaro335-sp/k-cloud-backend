/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetAdminDTO {
  @IsBoolean()
  @ApiProperty({ type: Boolean })
  admin: boolean;
}
