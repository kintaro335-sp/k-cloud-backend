/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */


export type ActionT = 'CREATED' | 'READ' | 'DOWNLOAD' | 'DELETE' | 'DOWNLOAD_ZIP' | 'MODIFY';

export type statusT = 'ALLOWED' | 'DENIED';

export type reasonT = 'NOT_EXIST' | 'EXPIRED' | 'WRONG_OWNER' | 'NONE';

export interface SharedFileActivity {
  id: string;
  date: Date;
  action: ActionT;
  status: statusT
  reason: reasonT
  user: string;
  tokenid: string;
  path: string;
}