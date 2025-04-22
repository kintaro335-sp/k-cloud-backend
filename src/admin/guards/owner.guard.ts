/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private adminService: AdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.userId;
    const ownerId = this.adminService.getOwner();
    if (ownerId === null) {
      return true;
    }
    if (userId !== ownerId) {
      throw new NotFoundException();
    }

    return true;
  }
}
