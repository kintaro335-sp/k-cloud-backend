/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Reflector } from '@nestjs/core';
import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private adminService: AdminService) {}

  canActivate(context: ExecutionContext): boolean {
    const requireAdmin = this.reflector.get<boolean>('adminR', context.getHandler()) || false;
    const request = context.switchToHttp().getRequest();
    if (requireAdmin && (request.user.isadmin || request.user.userId === this.adminService.getOwner())) {
      return true;
    }
    if (requireAdmin) {
      throw new NotFoundException();
    }

    return true;
  }
}
