/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

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

    const sessionInfo = await this.sessionsService.validateSession(request.user.sessionId);
    request.user.username = sessionInfo.username;
    request.user.isadmin = sessionInfo.isadmin;
    return true;
  }
}
