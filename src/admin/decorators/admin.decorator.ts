/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { SetMetadata } from '@nestjs/common';

export const RequireAdmin = (requireAdmin: boolean) => SetMetadata('adminR', requireAdmin);