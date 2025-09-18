/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { IsString } from 'class-validator';

export class SetPasswordDTO {
  @IsString()
  password: string;
}
