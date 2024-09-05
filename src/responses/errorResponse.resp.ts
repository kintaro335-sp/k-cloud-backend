import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponse {
  @ApiProperty()
  @IsString()
  message: string;
  @ApiProperty()
  @IsNumber()
  code: number;
}
