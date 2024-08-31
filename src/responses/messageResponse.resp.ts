import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MessageResponse {
  @ApiProperty()
  @IsString()
  message: string;
}
