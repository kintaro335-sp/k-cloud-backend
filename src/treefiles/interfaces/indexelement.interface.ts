interface IndexElement {
  name: string;
  path: string;
  size: number;
  mime_type: string;
}

export type IndexList = IndexElement[];
