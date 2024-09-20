/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveFilesDTO {
  @IsString()
  @ApiProperty()
  newPath: string;
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  files: string[];
}
