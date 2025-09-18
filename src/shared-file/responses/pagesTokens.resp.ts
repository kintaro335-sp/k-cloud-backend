/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { ApiProperty } from '@nestjs/swagger';

export class PagesTokensResp {
  @ApiProperty({ type: Number })
  pages: number
}
