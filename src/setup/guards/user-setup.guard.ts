import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
// service
import { SetupService } from '../setup.service';
import { AdminService } from '../../admin/admin.service';

@Injectable()
export class UserSetupGuard implements CanActivate {
  constructor(private readonly setupServ: SetupService, private readonly adminServ: AdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return !(await this.setupServ.isConfigured());
  }
}
