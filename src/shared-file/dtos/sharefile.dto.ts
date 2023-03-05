import { IsString, IsBoolean } from 'class-validator';

export class ShareFileDTO {
  @IsBoolean()
  expires: boolean;
  @IsString()
  expire: string;
}
