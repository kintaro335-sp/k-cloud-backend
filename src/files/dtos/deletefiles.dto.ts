import { IsString } from 'class-validator';

export class DeleteFilesDTO {
  @IsString({ each: true })
  files: string[];
}
