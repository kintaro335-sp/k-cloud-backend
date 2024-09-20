/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyNameDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;
}
