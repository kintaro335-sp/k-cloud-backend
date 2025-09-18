/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { IsString, IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Scope } from '../../sessions/interfaces/session.interface';
import { ScopesEnum } from './scopelist';

export class ApiKeyNameDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsEnum(
    ScopesEnum,
    { each: true }
  )
  scopes: Scope[];
}
