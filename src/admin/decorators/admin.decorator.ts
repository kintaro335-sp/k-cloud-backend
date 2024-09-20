/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { SetMetadata } from '@nestjs/common';

export const RequireAdmin = (requireAdmin: boolean) => SetMetadata('adminR', requireAdmin);