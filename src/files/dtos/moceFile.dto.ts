import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveFileDTO {
  @IsString()
  @ApiProperty()
  newpath: string;
}
