/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

export interface SessionsResponseI {
  data: { id: string; expire: Date; device: string }[];
  total: number;
}

export interface ApiKeysResponseI {
  data: { id: string; token: string, name: string; scopes: string[] }[];
  total: number;
}
