import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean } from 'class-validator';

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
  @IsBoolean()
  isadmin: boolean;
}
