import { IsString } from 'class-validator';

export class RenameDTO {
  @IsString()
  newpath: string;
}
