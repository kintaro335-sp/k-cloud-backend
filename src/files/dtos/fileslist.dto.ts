/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FilesListDTO {
  @IsString()
  @ApiProperty()
  newPath: string;
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  files: string[];
}
