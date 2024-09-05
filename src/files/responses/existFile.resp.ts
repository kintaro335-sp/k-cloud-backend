import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExistFileResponse {
  @ApiProperty()
  @IsBoolean()
  exist: boolean;
}
