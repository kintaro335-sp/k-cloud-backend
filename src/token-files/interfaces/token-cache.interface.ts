/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Sharedfile } from '@prisma/client';

interface TokenCacheItem {
  data: Sharedfile;
  lastUsed: Date;
}

export type TokensCache = Record<string, TokenCacheItem>; 

interface TokensPageCache {
  tokens: Sharedfile[];
  lastUsed: Date;
}

export type TokensCachePage = Record<number, TokensPageCache>;
