import { Injectable, UnauthorizedException } from '@nestjs/common';
// services
import { PrismaService } from '../prisma.service';
// interfaces
import { UserPayload } from 'src/auth/interfaces/userPayload.interface';
import { Session } from './interfaces/session.interface';
// misc
import { v4 as uuidv4 } from 'uuid';
import * as dayjs from 'dayjs';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async retrieveSession(sessionId: string) {
    while (true) {
      try {
        return this.prisma.sessions.findUnique({
          where: {
            id: sessionId
          }
        });
      } catch (error) {}
    }
  }


  async revokeSession(sessionId: string) {
    while (true) {
      try {
        return this.prisma.sessions.delete({
          where: {
            id: sessionId
          }
        });
      } catch (error) {}
    }
  }

  async validateSession(sessionId: string) {
    const session = await this.retrieveSession(sessionId);

    if (!session) {
      throw new UnauthorizedException();
    }

    const today = new Date();
    if (today > session.expire && session.doesexpire) {
      this.revokeSession(sessionId);
      throw new UnauthorizedException();
    }
  }
}
