/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

export type SessionType = 'session' | 'api';

export interface Session {
  id: string;
  username?: string;
  name?: string;
  userid: string;
  token: string;
  type: SessionType;
  doesexpire: boolean;
  isadmin: boolean;
  expire: Date;
  device: string;
}

export interface SessionCache extends Session {
  lastUsed: Date;
}
