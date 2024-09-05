import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteFilesDTO {
  @IsString({ each: true })
  @ApiProperty()
  files: string[];
}
