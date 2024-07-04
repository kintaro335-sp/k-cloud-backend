import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
// services
import { PrismaService } from '../prisma.service';
import { SystemService } from '../system/system.service';
// errors
import { InvalidSessionError } from './errors/invalidsession.error';
// interfaces
import { UserPayload } from 'src/auth/interfaces/userPayload.interface';
import { Session, SessionCache, SessionType } from './interfaces/session.interface';
// misc
import { v4 as uuidv4 } from 'uuid';
import * as dayjs from 'dayjs';

// TODO: hacer funciones para hacer api keys

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService, private readonly system: SystemService) {}

  private sessionsCache: Record<string, SessionCache> = {};

  @Cron(CronExpression.EVERY_30_MINUTES)
  private cleanSessionsCache() {
    const now = dayjs().toDate();
    Object.keys(this.sessionsCache).forEach((key) => {
      const session = this.sessionsCache[key];
      if (now.getTime() - session.lastUsed.getTime() > 1000 * 60 * 60) {
        console.log(`Deleting session ${key}`);
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
    } catch (error) {}
  }

  createSesionId() {
    return uuidv4();
  }

  async createSession(sessionId: string, user: UserPayload, device: string) {
    const expireIn = dayjs().add(7, 'day').toDate();
    const newSession: Session = {
      id: sessionId,
      userid: user.userId,
      token: '',
      type: 'session',
      doesexpire: true,
      expire: expireIn,
      device
    };

    while (true) {
      try {
        return this.prisma.sessions.create({
          data: newSession
        });
      } catch (error) {}
    }
  }

  async createApiKey(name: string, sessionId: string, user: UserPayload, token: string) {
    const newApiKey: Session = {
      id: sessionId,
      name,
      userid: user.userId,
      token,
      type: 'api',
      doesexpire: false,
      expire: new Date(),
      device: 'none'
    };
    while (true) {
      try {
        return this.prisma.sessions.create({
          data: newApiKey
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
          this.sessionsCache[sessionId] = { ...session, type: session.type as SessionType, lastUsed: new Date() };
        }
        return session;
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

  async validateSession(sessionId: string, websocket = false) {
    const session = await this.retrieveSession(sessionId);

    if (!session) {
      if (websocket) {
        throw new InvalidSessionError("Invalid session");
      }
      throw new UnauthorizedException()
    }

    const today = new Date();
    if (today > session.expire && session.doesexpire) {
      this.revokeSession(sessionId);
      if (websocket) {
        throw new InvalidSessionError("Session Expired");
      }
      throw new UnauthorizedException();
    }
    if (this.sessionsCache[sessionId] !== undefined) {
      const newDate = new Date();
      this.sessionsCache[sessionId].lastUsed = newDate;
    }
  }

  async getSessionsByUserId(userId: string) {
    const today = new Date();
    while (true) {
      try {
        return this.prisma.sessions.findMany({
          select: {
            id: true,
            expire: true,
            device: true,
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
