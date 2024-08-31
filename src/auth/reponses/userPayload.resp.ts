import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UsePayloadRespose {
  @ApiProperty()
  @IsString()
  sessionId: string;
  @ApiProperty()
  @IsString()
  userId: string;
  @ApiProperty()
  @IsString()
  username: string;
  @ApiProperty()
  @IsString()
  isadmin: boolean;
}
