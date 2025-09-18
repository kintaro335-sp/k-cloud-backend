/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { IsArray, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '../interfaces/list-file.interface';

export class FileResponse {
  @ApiProperty()
  @IsString()
  name: string;
  @ApiProperty()
  @IsString()
  @IsEnum({ folder: 'folder', file: 'file' })
  type: FileType;
  @ApiProperty()
  @IsNumber()
  size: number;
  @ApiProperty()
  @IsNumber()
  tokens: number;
  @ApiProperty()
  @IsString()
  extension: string;
  @ApiProperty()
  @IsString()
  mime_type: string;
}

export class FileListResponse {
  @IsArray()
  @Type(() => FileResponse)
  @ApiProperty({ type: FileResponse, isArray: true })
  list: FileResponse[];
}
