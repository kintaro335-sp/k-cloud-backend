/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

interface IndexElement {
  name: string;
  path: string;
  size: number;
  mime_type: string;
}

export type IndexList = IndexElement[];
