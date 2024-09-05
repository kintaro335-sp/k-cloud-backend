import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MemoryUsageResponse {
  @IsNumber()
  @ApiProperty()
  usage: number;
}
