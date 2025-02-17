/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { IsString, IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Scope } from '../../sessions/interfaces/session.interface';

export class ApiKeyEditScopesDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsEnum(
    {
      'files:read': 'files:read',
      'files:create': 'files:create',
      'files:delete': 'files:delete',
      'files:rename': 'files:rename',
      'files:move': 'files:move',
      'tokens:read': 'tokens:read',
      'tokens:create': 'tokens:create',
      'tokens:update': 'tokens:update',
      'tokens:delete': 'tokens:delete',
      'admin:users': 'admin:users',
      'admin:activity-read': 'admin:activity-read',
      'admin:memory-usage': 'admin:memory-usage',
      'auth:read-api-keys': 'auth:read-api-keys',
      'auth:create-api-keys': 'auth:create-api-keys',
      'auth:read-sessions': 'auth:read-sessions',
      'auth:delete-sessions': 'auth:delete-sessions'
    },
    { each: true }
  )
  scopes: Scope[];
}
