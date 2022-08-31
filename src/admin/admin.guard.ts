import { Reflector } from '@nestjs/core';
import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireAdmin = this.reflector.get<boolean>('adminR', context.getHandler()) || false;
    const request = context.switchToHttp().getRequest();
    if (requireAdmin && request.user.isadmin) {
      return true;
    }
    if (requireAdmin) {
      throw new NotFoundException();
    }

    return true;
  }
}
