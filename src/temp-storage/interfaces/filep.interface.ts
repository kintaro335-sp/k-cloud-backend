import { WriteStream } from 'fs';

type BytesWritten = { from: number; to: number };

export interface BlobFTemp {
  position: number;
  blob: Buffer;
}

export interface FilePTemp {
  name: string;
  size: number;
  received: number;
  saved: number;
  bytesWritten: Array<BytesWritten>;
  completed: boolean;
  blobs: BlobFTemp[];
  writting: boolean;
  path: string;
  userId: string;
}

export interface FilePTempResponse {
  name: string;
  size: number;
  received: number;
  saved: number;
  completed: boolean;
  blobsNum: number;
}
