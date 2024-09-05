import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { reasonT, ActionT, statusT } from '../../logs/interfaces/sharedfileActivity.interface';

export class SharedFileActivityResp {
  @IsString()
  @ApiProperty()
  id: string;
  @IsString()
  @ApiProperty()
  date: string;
  @IsString()
  @ApiProperty({ type: String, enum: ['CREATED', 'READ', 'DOWNLOAD', 'DELETE', 'DOWNLOAD_ZIP', 'MODIFY'] })
  action: ActionT;
  @IsString()
  @ApiProperty({ type: String, enum: ['ALLOWED', 'DENIED'] })
  status: statusT;
  @IsString()
  @ApiProperty({ type: String, enum: ['NOT_EXIST', 'EXPIRED', 'WRONG_OWNER', 'NONE'] })
  reason: reasonT;
  @IsString()
  @ApiProperty()
  user: string;
  @IsString()
  @ApiProperty()
  tokenid: string;
  @IsString()
  @ApiProperty()
  path: string;
}
