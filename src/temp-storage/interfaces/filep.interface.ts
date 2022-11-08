
export interface BlobFTemp {
  position: number;
  blob: Buffer
}

export interface FilePTemp {
  name: string;
  size: number;
  saved: number;
  completed: boolean;
  blobs: BlobFTemp[];
}
