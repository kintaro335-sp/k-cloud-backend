import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
// service
import { SetupService } from '../setup.service';

@Injectable()
export class UserSetupGuard implements CanActivate {
  constructor(private readonly setupServ: SetupService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return this.setupServ.isConfigured();
  }
}
