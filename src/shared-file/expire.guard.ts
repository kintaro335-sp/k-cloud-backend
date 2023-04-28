import { Injectable, CanActivate, ExecutionContext, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TokenFilesService } from '../token-files/token-files.service';

@Injectable()
export class ExpireGuard implements CanActivate {
  constructor(private readonly tokensServ: TokenFilesService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const idToken = request.params.id;
    const SFReg = await this.tokensServ.getSharedFileByID(idToken);
    if (SFReg === null) {
      throw new NotFoundException('Not found');
    }
    const today = new Date();
    if (today > SFReg.expire && SFReg.doesexpires) {
      this.tokensServ.removeSharedFile(idToken);
      throw new NotFoundException('Not Found');
    }
    return true;
  }
}
