import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UsedSpaceTypeResp {
  @ApiProperty()
  @IsString()
  type: string;
  @IsNumber()
  @ApiProperty({ type: Number })
  used: number;
}
