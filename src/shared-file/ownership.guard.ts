import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { TokenFilesService } from '../token-files/token-files.service';

@Injectable()
export class OwnerShipGuard implements CanActivate {
  constructor(private readonly tokensServ: TokenFilesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const id = request.params.id;
    const SFReg = await this.tokensServ.getSharedFileByID(id);
    if (SFReg === null) {
      throw new NotFoundException('No encntrado');
    }

    if (SFReg.userid !== request.user.id) {
    }

    return true;
  }
}
