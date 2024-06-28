export interface SessionsResponse {
  data: { id: string; expire: Date; device: string }[];
  total: number;
}

export interface ApiKeysResponse {
  data: { id: string; token: string }[];
  total: number;
}
