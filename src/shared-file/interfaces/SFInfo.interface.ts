import { FileType } from '../../files/interfaces/list-file.interface';

export interface SFInfoResponse {
  type: FileType;
  name: string;
  expire: boolean;
  expires: number;
  size: number;
  mime_type: string;
}
