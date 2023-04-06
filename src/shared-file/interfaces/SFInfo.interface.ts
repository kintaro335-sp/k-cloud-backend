import { FileType } from '../../files/interfaces/list-file.interface';

export interface SFInfoResponse {
  type: FileType;
  name: string;
  createdAt: number;
  expire: boolean;
  expires: number;
  size: number;
  mime_type: string;
}
