/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { IsBoolean } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ConfiguredResponse {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  configured: boolean
}
