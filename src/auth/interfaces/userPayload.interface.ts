/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
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
