/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

interface IndexElement {
  lowercase_name: string;
  name: string;
  path: string;
  size: number;
  type: 'file' | 'folder';
  mime_type: string;
}

export type IndexList = IndexElement[];
