/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
// services
import { PrismaService } from '../prisma.service';
import { SystemService } from '../system/system.service';
import { UsersService } from '../users/users.service';
// errors
import { InvalidSessionError } from './errors/invalidsession.error';
// interfaces
import { Sessions } from '@prisma/client';
import { JWTPayload, UserPayload } from 'src/auth/interfaces/userPayload.interface';
import { Scope, Session, SessionCache, SessionType } from './interfaces/session.interface';
// misc
import { v4 as uuidv4 } from 'uuid';
import * as dayjs from 'dayjs';

const timeTextRegex = new RegExp(/[0-9]+[h|M|d|y]/);

const numberRegex = new RegExp(/[0-9]+/);

const typeRegex = new RegExp(/[h|M|d|y]/);

@Injectable()
export class SessionsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly system: SystemService,
    private configService: ConfigService
  ) {}

  private sessionsCache: Record<string, SessionCache> = {};

  private expireInType: dayjs.ManipulateType = 'day';

  private expireInNum = 7;

  private expireCacheType: dayjs.ManipulateType = 'hour';

  private expireCacheNum = 1;

  onModuleInit() {
    const expireInStr = this.configService.get<string>('SESSION_EXPIRE');
    const expireCache = this.configService.get<string>('SESSION_EXPIRE_CACHE');

    if (timeTextRegex.test(expireInStr)) {
      const match = timeTextRegex.exec(expireInStr)[0];
      const number = numberRegex.exec(match)[0];
      const type = typeRegex.exec(match)[0] as dayjs.ManipulateType;
      this.expireInNum = Number(number);
      this.expireInType = type;
    }

    if (timeTextRegex.test(expireCache)) {
      const match = timeTextRegex.exec(expireCache)[0];
      const number = numberRegex.exec(match)[0];
      const type = typeRegex.exec(match)[0] as dayjs.ManipulateType;
      this.expireCacheNum = Number(number);
      this.expireCacheType = type;
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  private cleanSessionsCache() {
    const now = dayjs().toDate();

    Object.keys(this.sessionsCache).forEach((key) => {
      const session = this.sessionsCache[key];
      const expirationDateSession = dayjs(session.lastUsed).add(this.expireCacheNum, this.expireCacheType).toDate();
      if (now > expirationDateSession) {
        delete this.sessionsCache[key];
      }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  private deleteExpiredSessions() {
    const now = dayjs().toDate();
    try {
      this.prisma.sessions.deleteMany({
        where: {
          doesexpire: true,
          expire: {
            lt: now
          }
        }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return;
      }
    }
  }

  invalidateSessionsByUserId(userId: string) {
    Object.keys(this.sessionsCache).forEach((key) => {
      const session = this.sessionsCache[key];
      if (session.userid === userId) {
        delete this.sessionsCache[key];
      }
    });
  }

  invalidateSessionById(sessionId: string) {
    try {
      delete this.sessionsCache[sessionId];
    } catch (error) {}
  }

  createSesionId() {
    return uuidv4();
  }

  private generateExpireDate() {
    const expireIn = dayjs().add(this.expireInNum, this.expireInType).toDate();
    return expireIn;
  }

  async createSession(sessionId: string, user: JWTPayload, device: string): Promise<Session> {
    const expireIn = this.generateExpireDate();
    const usern = await this.usersService.findOne({ id: user.userId }, { username: true, isadmin: true });
    const newSession: Sessions = {
      id: sessionId,
      name: usern.username,
      userid: user.userId,
      token: '',
      type: 'session',
      doesexpire: true,
      expire: expireIn,
      device,
      scopes: '[]'
    };

    while (true) {
      try {
        const sessionD = await this.prisma.sessions.create({
          data: newSession
        });
        return { ...sessionD, type: sessionD.type as SessionType, isadmin: usern.isadmin, scopes: JSON.parse(sessionD.scopes) as Scope[] };
      } catch (error) {}
    }
  }

  async createApiKey(name: string, sessionId: string, user: JWTPayload, token: string, scopes: Scope[] = []) {
    const usern = await this.usersService.findOne({ id: user.userId }, { username: true, isadmin: true });
    const newApiKey: Session = {
      id: sessionId,
      name,
      username: usern.username,
      isadmin: usern.isadmin,
      userid: user.userId,
      token,
      type: 'api',
      doesexpire: false,
      expire: new Date(),
      device: 'none',
      scopes: scopes
    };
    while (true) {
      try {
        return this.prisma.sessions.create({
          data: { ...newApiKey, scopes: JSON.stringify(scopes) }
        });
      } catch (error) {}
    }
  }

  async editApiKeyScopes(sessionId: string, scopes: Scope[]) {
    while (true) {
      try {
        return this.prisma.sessions.update({
          where: {
            id: sessionId
          },
          data: {
            scopes: JSON.stringify(scopes)
          }
        });
      } catch (error) {}
    }
  }

  async retrieveSession(sessionId: string) {
    const cacheSession = this.sessionsCache[sessionId];
    if (cacheSession !== undefined) {
      return cacheSession;
    }

    while (true) {
      try {
        const session = await this.prisma.sessions.findUnique({
          where: {
            id: sessionId
          }
        });
        if (session !== null) {
          const usern = await this.usersService.findOne({ id: session.userid }, { username: true, isadmin: true });
          this.sessionsCache[sessionId] = {
            ...session,
            type: session.type as SessionType,
            lastUsed: new Date(),
            username: usern.username,
            isadmin: usern.isadmin,
            scopes: JSON.parse(session.scopes) as Scope[]
          };
        }
        return this.sessionsCache[sessionId];
      } catch (error) {}
    }
  }

  async revokeSession(sessionId: string) {
    delete this.sessionsCache[sessionId];
    while (true) {
      try {
        const count = await this.prisma.sessions.count({ where: { id: sessionId } });
        if (count === 0) return null;
        this.system.emitLogout(sessionId);
        return this.prisma.sessions.delete({
          where: {
            id: sessionId
          }
        });
      } catch (error) {}
    }
  }

  private async revenueSession(sessionId: string, newExpirationDate: Date) {
    if (this.sessionsCache[sessionId] !== undefined) {
      this.sessionsCache[sessionId].expire = newExpirationDate;
    }
    while (true) {
      try {
        return this.prisma.sessions.update({ data: { expire: newExpirationDate }, where: { id: sessionId } });
      } catch (_err) {}
    }
  }

  private async checkSessionExpiration(sessionId: string, expirationDate: Date, today: Date) {
    const diferenceHours = dayjs(expirationDate).diff(dayjs(today), 'hour');
    if (diferenceHours < 24) {
      const newExpirationDate = dayjs(expirationDate).add(this.expireInNum, this.expireInType).toDate();
      await this.revenueSession(sessionId, newExpirationDate);
    }
  }

  async validateSession(sessionId: string, websocket = false): Promise<SessionCache> {
    const session = await this.retrieveSession(sessionId);

    if (!session) {
      if (websocket) {
        throw new InvalidSessionError('Invalid session');
      }
      throw new UnauthorizedException();
    }

    const today = new Date();
    if (today > session.expire && session.doesexpire) {
      this.revokeSession(sessionId);
      if (websocket) {
        throw new InvalidSessionError('Session Expired');
      }
      throw new UnauthorizedException();
    }
    if (this.sessionsCache[sessionId] !== undefined) {
      const newDate = new Date();
      this.sessionsCache[sessionId].lastUsed = newDate;
    }
    await this.checkSessionExpiration(sessionId, session.expire, today);
    return session;
  }

  async getSessionsByUserId(userId: string) {
    const today = new Date();
    while (true) {
      try {
        return this.prisma.sessions.findMany({
          select: {
            id: true,
            expire: true,
            device: true
          },
          where: {
            userid: userId,
            type: 'session',
            expire: {
              gt: today
            }
          }
        });
      } catch (error) {}
    }
  }

  async getApiKeysByUserId(userId: string) {
    while (true) {
      try {
        return this.prisma.sessions.findMany({
          select: {
            id: true,
            name: true,
            token: true,
            scopes: true
          },
          where: {
            userid: userId,
            type: 'api'
          }
        });
      } catch (error) {}
    }
  }
}
