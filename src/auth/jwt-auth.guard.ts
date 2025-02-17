/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */
import { Reflector } from '@nestjs/core';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
// services
import { SessionsService } from '../sessions/sessions.service';
import { Scope } from '../sessions/interfaces/session.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly reflector: Reflector
  ) {
    super();
  }

  isAllowedApiKey(apiScopes: Scope[], requiredScopes: Scope[]): boolean {
    const allowedScopes = requiredScopes.filter((scope) => apiScopes.includes(scope));
    console.log(allowedScopes);
    return allowedScopes.length > 0;
  }

  async canActivate(context: ExecutionContext) {
    const requiredScopes = this.reflector.get<Scope[]>('scopesR', context.getHandler()) || [];
    await super.canActivate(context);
    const request = this.getRequest(context);

    const sessionInfo = await this.sessionsService.validateSession(request.user.sessionId);
    if (sessionInfo.type === 'api') {
      if (!this.isAllowedApiKey(['npr', ...sessionInfo.scopes], requiredScopes)) {
        throw new UnauthorizedException();
      }
    }
    request.user.username = sessionInfo.username;
    request.user.isadmin = sessionInfo.isadmin;
    return true;
  }
}
