/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { ApiProperty } from '@nestjs/swagger';
import { FileType } from "src/files/interfaces/list-file.interface";

export class TokenElementResp {
  @ApiProperty({ type: String, enum: ['file', 'folder'] })
  type: FileType;
  @ApiProperty({ type: String })
  name: string;
  @ApiProperty({ type: String })
  id: string;
  @ApiProperty({ type: String })
  mime_type: string;
  @ApiProperty({ type: Boolean })
  expire: boolean;
  @ApiProperty({ type: Boolean })
  publict: boolean;
  @ApiProperty({ type: Number })
  expires: number;
}
