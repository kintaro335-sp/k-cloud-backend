/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VersionResponse {
  @IsString()
  @ApiProperty()
  version: string;
  @IsString()
  @ApiProperty()
  app: string;
}

@Injectable()
export class AppService {
  getAbout() {
    return {
      app: 'k-cloud-backend',
      version: 'v1.2.0'
    };
  }
}
