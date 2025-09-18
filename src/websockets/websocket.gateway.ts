/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
// services
import { WebSocketFilesService } from './websocketfiles.service';
import { SessionsService } from '../sessions/sessions.service';
// errors
import { isInvalidSessionError } from '../sessions/errors/invalidsession.error';
// interfaces
import { UserPayload } from 'src/auth/interfaces/userPayload.interface';
import { Interval } from '@nestjs/schedule';

@WebSocketGateway(5001, { cors: true, namespace: '/', transports: ['websocket'] })
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private wsFiles: WebSocketFilesService,
    private jwtService: JwtService,
    private sessionsService: SessionsService
  ) {}

  @WebSocketServer() wss: Server;

  async handleConnection(client: Socket, ...args: any[]) {
    const token_auth = client.handshake.auth.access_token as string;
    const token_header = client.handshake.headers.authorization;
    let payload: UserPayload;
    try {
      payload = this.jwtService.verify(token_auth || token_header) as UserPayload;
      await this.sessionsService.validateSession(payload.sessionId, true);
      this.wsFiles.handleConnect(client, payload);
      client.emit('message', 'Welcome');
    } catch (error) {
      if (isInvalidSessionError(error)) {
        client.emit('message', error.message);
        client.disconnect();
        return;
      }
      this.wsFiles.handleConnect(client, { sessionId: 'Guest', userId: 'Guest', isadmin: false, username: 'Guest' });
      return;
    }
  }

  @SubscribeMessage('auth')
  onAuth(client: Socket, data: string) {
    try {
      const payload = this.jwtService.verify(data) as UserPayload;
      this.wsFiles.handleAuth(client, payload);
      client.emit('message', 'authenticated');
    } catch (error) {}
  }

  @SubscribeMessage('logout')
  onLogout(client: Socket) {
    this.wsFiles.handleLogout(client);
  }

  @SubscribeMessage('new-file')
  onNewFile(client: Socket, data: any) {
    client.emit('file-upload');
  }

  @SubscribeMessage('who-am-i')
  onWhoAmI(client: Socket) {
    client.emit('message', this.wsFiles.getUserInfo(client.id));
  }

  handleDisconnect(client: Socket) {
    this.wsFiles.handleDisconnect(client);
  }

  // @Interval(2000)
  // private FUpdate() {
  //   this.wss.emit('file-upload');
  // }
}
