import { IsString } from 'class-validator';

export class RenameDTO {
  @IsString()
  newName: string;
}
