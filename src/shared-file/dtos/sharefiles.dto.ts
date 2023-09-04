import { IsNumber, IsBoolean, IsArray } from 'class-validator';

export class ShareFilesDTO {
  @IsBoolean()
  expires: boolean;
  @IsBoolean()
  public: boolean;
  @IsNumber()
  expire: number;
  @IsArray()
  files: string[];
}
