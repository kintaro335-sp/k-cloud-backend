/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { ApiProperty } from '@nestjs/swagger';
import { FileType } from "src/files/interfaces/list-file.interface";

export class TokenElementResp {
  type: FileType;
  name: string;
  id: string;
  mime_type: string;
  expire: boolean;
  publict: boolean;
  expires: number;
}
