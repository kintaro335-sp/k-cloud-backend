import { IsNumber } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class FileInitDTO {
  @IsNumber()
  @ApiProperty()
  size: number;
}
