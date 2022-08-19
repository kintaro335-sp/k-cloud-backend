export interface File {
  name: string;
  type: string;
  size: number;
  extension: string;
  mime_type: string;
}

export interface ListFile {
  list: File[];
}