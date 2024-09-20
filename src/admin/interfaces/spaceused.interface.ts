/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
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
