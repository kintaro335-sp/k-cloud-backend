import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
// services
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly sessionsService: SessionsService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    await super.canActivate(context);
    const request = this.getRequest(context);
    const today = new Date();

    const session = await this.sessionsService.retrieveSession(request.user.sessionId);
    console.log(request.user)
    return true;
  }
}
