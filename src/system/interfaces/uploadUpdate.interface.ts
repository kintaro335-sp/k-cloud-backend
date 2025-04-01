/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { FilePTempResponse } from 'src/temp-storage/interfaces/filep.interface';

export interface UpdateUploadEvent {
  userid: string;
  path: string;
  fileStatus: FilePTempResponse;
}
