/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { ApiProperty } from '@nestjs/swagger';

export class SharedFileIdResp {
  @ApiProperty()
  id: string;
}
