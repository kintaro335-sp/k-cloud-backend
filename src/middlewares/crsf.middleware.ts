/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
// services
import { SessionsService } from '../sessions/sessions.service';
// misc
import { doubleCsrf } from 'csrf-csrf';
import { v1 as uuidv1 } from 'uuid';
// types
import { JWTPayload } from '../auth/interfaces/userPayload.interface';

const csrf = doubleCsrf({
  cookieName: 'csrf-token',
  cookieOptions: { path: '/', httpOnly: true },
  getSecret: (req) => {
    return req.cookies['csrf-secret'];
  },
  getSessionIdentifier: (req) => {
    return req.cookies['csrf-token'];
  }
});

@Injectable()
export class CSRFMiddleware implements NestMiddleware {
  constructor(
    private jwtServ: JwtService,
    private sessionsServ: SessionsService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.query.t as string;

    if (!token) {
      next();
      return;
    }

    const JWTPayload: JWTPayload = this.jwtServ.decode(token);
    const sessionInfo = await this.sessionsServ.retrieveSession(JWTPayload.sessionId);

    if (sessionInfo.type === 'api') {
      next();
      return;
    }

    if (!req.cookies['csrf-secret']) {
      const secret = uuidv1();
      res.cookie('csrf-secret', secret, { httpOnly: true });
    }

    csrf.generateToken(req, res, true, true);
    next();
  }
}
