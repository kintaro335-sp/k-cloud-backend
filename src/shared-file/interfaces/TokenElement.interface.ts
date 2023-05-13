import { FileType } from '../../files/interfaces/list-file.interface';

export interface TokenElement {
  type: FileType;
  name: string;
  id: string;
  mime_type: string;
  expire: boolean;
  expires: number;
}
