type FileType = 'folder' | 'file'

export interface File {
  name: string;
  type: FileType;
  size: bigint;
  extension: string;
  mime_type: string;
}

export interface ListFile {
  list: File[];
}

export interface Folder {
  type: 'Folder';
  name: string;
  content: Array<Folder | File>
}
