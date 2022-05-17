export interface File {
  name: string;
  type: string;
  size: number;
  extension: string;
}

export interface ListFile {
  list: File[];
}