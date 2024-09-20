/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { IsString } from 'class-validator';

export class SetPasswordDTO {
  @IsString()
  password: string;
}
