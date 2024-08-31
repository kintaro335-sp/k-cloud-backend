export interface SessionsResponseI {
  data: { id: string; expire: Date; device: string }[];
  total: number;
}

export interface ApiKeysResponseI {
  data: { id: string; token: string, name: string; }[];
  total: number;
}
