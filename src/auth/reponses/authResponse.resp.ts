import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponse {
  @ApiProperty()
  @IsString()
  access_token: string;
}
