/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */
import { IsString, IsISO8601, IsOptional } from 'class-validator';

export class DateRangeDTO {
  @IsString()
  @IsISO8601()
  @IsOptional()
  from?: string;
  @IsString()
  @IsISO8601()
  @IsOptional()
  to?: string;
}
