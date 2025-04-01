/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

export interface SpaceUsed {
  total: number;
  used: number;
}

export interface UsedSpaceUser {
  id: string;
  username: string;
  usedSpace: number;
}
