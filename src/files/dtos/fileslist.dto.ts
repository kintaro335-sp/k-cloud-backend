import { IsArray, IsString } from 'class-validator';

export class FilesListDTO {
  @IsString()
  newPath: string;
  @IsArray()
  files: string[];
}
