export interface SharedFileActivity {
  id: string;
  date: Date;
  action: 'CREATED' | 'READ' | 'DOWNLOAD' | 'DELETE' | 'DOWNLOAD_ZIP' | 'MODIFY';
  status: 'ALLOWED' | 'DENIED';
  reason: 'NOT_EXIST' | 'EXPIRED' | 'WRONG_OWNER';
  user: string;
  tokenid: string;
  path: string;
}