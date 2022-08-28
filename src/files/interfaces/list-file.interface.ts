type FileType = 'folder' | 'file'

export interface File {
  name: string;
  type: FileType;
  size: number;
  extension: string;
  mime_type: string;
}

export interface ListFile {
  list: File[];
}