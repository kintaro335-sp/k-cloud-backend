import { Injectable } from '@nestjs/common';
// services
import { PrismaService } from '../prisma.service';
// interfaces
import { UserPayload } from 'src/auth/interfaces/userPayload.interface';
import { Session } from './interfaces/session.interface';
// misc
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  createSesionId() {
    return uuidv4();
  }

  async createSession(sessionId: string, user: UserPayload, device: string) {
    const newSession: Session = {
      id: sessionId,
      userid: user.userId,
      token: '',
      type: 'session',
      doesexpire: true,
      expire: new Date(),
      device
    }

    return this.prisma.sessions.create({
      data: newSession
    })
  }

  async retrieveSession(sessionId: string) {
    return this.prisma.sessions.findUnique({
      where: {
        id: sessionId
      }
    })
  }

}
