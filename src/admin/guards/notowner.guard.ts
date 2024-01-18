import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class NotOwnerGuard implements CanActivate {
  constructor(private adminService: AdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.params.userid;
    const ownerId = this.adminService.getOwner();
    if (userId === ownerId) {
      throw new NotFoundException();
    }

    return true;
  }
}

