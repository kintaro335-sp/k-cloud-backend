/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

export type FileType = 'folder' | 'file';

export interface File {
  name: string;
  type: FileType;
  size: number;
  tokens: number;
  extension: string;
  mime_type: string;
}

export interface ListFile {
  list: File[];
}

export interface Folder {
  type: 'Folder';
  name: string;
  size: number;
  content: Array<Folder | File>;
}

export interface UsedSpaceType {
  type: string;
  used: number;
}
