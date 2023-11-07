import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebSocketFilesService } from './websocketfiles.service';
import { JwtService } from '@nestjs/jwt';
import { UserPayload } from 'src/auth/interfaces/userPayload.interface';

@WebSocketGateway(5001, { cors: true, namespace: '/' })
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private wsFiles: WebSocketFilesService, private jwtService: JwtService) {}

  @WebSocketServer() wss: Server;

  handleConnection(client: Socket, ...args: any[]) {
    const token = client.handshake.auth.access_token as string;
    let payload: UserPayload;
    try {
      payload = this.jwtService.verify(token);
      this.wsFiles.handleConnect(client, payload);
      client.emit('message', 'Welcome')
    } catch (error) {
      client.disconnect();
      return;
    }
  }

  handleDisconnect(client: Socket) {
    this.wsFiles.handleDisconnect(client);
  }
}