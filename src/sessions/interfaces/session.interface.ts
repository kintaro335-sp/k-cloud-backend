/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

export type SessionType = 'session' | 'api';

export type Scope =
  | 'files:read'
  | 'files:create'
  | 'files:delete'
  | 'files:rename'
  | 'files:move'
  | 'tokens:read'
  | 'tokens:create'
  | 'tokens:update'
  | 'tokens:delete'
  | 'admin:users'
  | 'admin:activity-read'
  | 'admin:memory-usage'
  | 'admin:manage-options'
  | 'admin:stats'
  | 'auth:read-api-keys'
  | 'auth:create-api-keys'
  | 'auth:read-sessions'
  | 'auth:delete-sessions'
  | 'auth:edit-api-keys'
  | 'npr';

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
  scopes: Scope[];
}

export interface SessionCache extends Session {
  lastUsed: Date;
}
