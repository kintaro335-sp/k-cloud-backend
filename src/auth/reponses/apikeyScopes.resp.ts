/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyScopesResp {
  @ApiProperty({ type: String, enum: { api: "api", session: "session" } })
  type: String
  @ApiProperty({ type: [String] })
  scopes: string []
}
