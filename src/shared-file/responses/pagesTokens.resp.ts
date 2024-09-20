/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { ApiProperty } from '@nestjs/swagger';

export class PagesTokensResp {
  @ApiProperty({ type: Number })
  pages: number
}
