export type SessionType = 'session' | 'api';

export interface Session {
  id: string;
  name?: string;
  userid: string;
  token: string;
  type: SessionType;
  doesexpire: boolean;
  expire: Date;
  device: string;
}

export interface SessionCache extends Session {
  lastUsed: Date;
}
