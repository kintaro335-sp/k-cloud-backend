import { IsNumber, IsBoolean } from 'class-validator';

export class ShareFileDTO {
  @IsBoolean()
  expires: boolean;
  @IsNumber()
  expire: number;
}
