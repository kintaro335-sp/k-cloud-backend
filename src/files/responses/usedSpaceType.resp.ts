import { IsString, IsNumber } from 'class-validator';
import { ApiProperty, } from '@nestjs/swagger';

export class UsedSpaceTypeResp {
  @ApiProperty({ type: String })
  @IsString()
  type: string;
  @ApiProperty({ type: Number })  
  @IsNumber()
  used: number;
}
