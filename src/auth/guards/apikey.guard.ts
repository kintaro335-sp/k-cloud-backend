import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
// services
import { SessionsService } from '../../sessions/sessions.service';
// interfaces
import { UserPayload } from '../interfaces/userPayload.interface';
import { takeRightWhile } from 'lodash';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private sessionsService: SessionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserPayload;
    if (!user) {
      throw new UnauthorizedException();
    }
    await this.sessionsService.validateSession(user.sessionId);
    const session = await this.sessionsService.retrieveSession(user.sessionId);
    if (session.type === 'api') {
      throw new UnauthorizedException();
    }
    return true;
  }
}
