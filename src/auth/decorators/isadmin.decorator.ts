import { SetMetadata } from '@nestjs/common';

export const RequireAdmin = (requireAdmin: boolean) => SetMetadata('adminR', requireAdmin);