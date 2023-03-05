import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { AdminService } from '../../admin/admin.service';

@Injectable()
export class SpaceGuard implements CanActivate {
  constructor(private readonly adminServ: AdminService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const size = request.body.size as number;
    const disk = this.adminServ.getUsedSpace();

    if (!(disk.used + size <= disk.total)) {
      throw new BadRequestException('not enought space');
    }

    return true;
  }
}
