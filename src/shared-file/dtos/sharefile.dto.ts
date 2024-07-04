import { IsNumber, IsBoolean } from 'class-validator';

export class ShareFileDTO {
  @IsBoolean()
  expires: boolean;
  @IsBoolean()
  public: boolean;
  @IsNumber()
  expire: number;
}
