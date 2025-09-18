/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { File } from "src/files/interfaces/list-file.interface";

export interface UpdateFileEvent {
  userid: string;
  path: string;
  type: 'add' | 'substitute';
  content: File
} 