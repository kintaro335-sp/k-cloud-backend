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
  bytesWritten:Array<BytesWritten>;
  completed: boolean;
  blobs: BlobFTemp[];
}
