import { IsString } from 'class-validator';

export class MoveFileDTO {
  @IsString()
  newpath: string;
}
