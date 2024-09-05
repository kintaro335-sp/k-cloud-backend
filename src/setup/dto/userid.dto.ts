import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserIdDTO {
  @IsString()
  @ApiProperty()
  userid: string;
}
