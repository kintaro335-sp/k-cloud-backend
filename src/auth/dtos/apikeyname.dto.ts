import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyNameDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;
}
