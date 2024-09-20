/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { ApiProperty } from '@nestjs/swagger';
import { FileType } from "src/files/interfaces/list-file.interface";


export class SharedFileInfoResp {
  @ApiProperty({ type: String, enum: ['file', 'folder'] })
  type: FileType;
  @ApiProperty({ type: String })
  name: string;
  @ApiProperty({ type: Number })
  createdAt: number;
  @ApiProperty({ type: Boolean })
  expire: boolean;
  @ApiProperty({ type: Number })
  expires: number;
  @ApiProperty({ type: Number })
  size: number;
  @ApiProperty({ type: String })
  mime_type: string;
}
