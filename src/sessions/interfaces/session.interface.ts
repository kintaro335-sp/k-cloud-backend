export interface Session {
  id: string;
  userid: string;
  token: string;
  type: 'session' | 'api';
  doesexpire: boolean;
  expire: Date;
  device: string;
}
