import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDTO {
  @IsString()
  @ApiProperty()
  username: string;
  @IsString()
  @ApiProperty()
  password: string;
}
