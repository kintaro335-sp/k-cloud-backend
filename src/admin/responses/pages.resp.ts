import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PagesResp {
  @ApiProperty({ type: Number })
  @IsNumber()
  pages: number;
}
