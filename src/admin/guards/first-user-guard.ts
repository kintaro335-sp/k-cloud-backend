import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class FirstUserGuard implements CanActivate {
  constructor(private readonly adminServ: AdminService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.params.userid === this.adminServ.getOwner()) {
      throw new ForbiddenException();
    }
    return true;
  }
}
