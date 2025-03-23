/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsString, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class FileResp {
  @ApiProperty()
  @IsString()
  name: string;
  @ApiProperty({ enum: ['File'] })
  @IsString()
  type: 'File';
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

export class TreeResp {
  @ApiProperty({ enum: ['Folder'] })  
  @IsString()
  type: 'Folder';
  @ApiProperty() 
  @IsString()
  name: string;
  @ApiProperty()
  @IsNumber()
  size: number;
  @ApiProperty()
  @IsArray()
  content: Array<TreeResp | FileResp>;
}
