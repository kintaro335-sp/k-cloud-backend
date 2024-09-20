/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { FilePTempResponse } from 'src/temp-storage/interfaces/filep.interface';

export interface UpdateUploadEvent {
  userid: string;
  path: string;
  fileStatus: FilePTempResponse;
}
