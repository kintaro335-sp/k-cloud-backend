import { IsString } from 'class-validator';

export class MoveFilesDTO {
  @IsString()
  newPath: string;
  @IsString({ each: true })
  files: string[];
}
