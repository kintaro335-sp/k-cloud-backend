/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { FileType } from '../../files/interfaces/list-file.interface';

export interface TokenElement {
  type: FileType;
  name: string;
  id: string;
  mime_type: string;
  expire: boolean;
  publict: boolean;
  expires: number;
}
