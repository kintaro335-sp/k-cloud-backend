interface TokenCacheItem {
  data: {
    id: string;
    userid: string;
    name: string;
    path: string;
    doesexpires: boolean;
    isdir: boolean;
    public: boolean;
    expire: Date;
    createdAt: Date;
  };
  lastUsed: Date;
}

export type TokensCache = Record<string, TokenCacheItem>; 
