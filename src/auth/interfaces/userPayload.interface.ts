/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */


export interface UserPayload {
  sessionId: string;
  userId: string;
  username: string;
  isadmin: boolean;
}

export interface JWTPayload {
  sessionId: string;
  userId: string;
}
