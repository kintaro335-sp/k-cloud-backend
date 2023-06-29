import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { AdminService } from '../../admin/admin.service';
import { TempStorageService } from '../../temp-storage/temp-storage.service';

@Injectable()
export class SpaceGuard implements CanActivate {
  constructor(private readonly adminServ: AdminService, private readonly tempStorage: TempStorageService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const size = request.body.size as number;
    const disk = this.adminServ.getUsedSpace();
    const unsavedBytes = this.tempStorage.getSpaceToUse();

    if (!(disk.used + size + unsavedBytes <= disk.total)) {
      throw new BadRequestException('not enought space');
    }

    return true;
  }
}
