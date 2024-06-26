import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebSocketFilesService } from './websocketfiles.service';
import { JwtService } from '@nestjs/jwt';
import { UserPayload } from 'src/auth/interfaces/userPayload.interface';
import { Interval } from '@nestjs/schedule';

@WebSocketGateway(5001, { cors: true, namespace: '/' })
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private wsFiles: WebSocketFilesService, private jwtService: JwtService) {}

  @WebSocketServer() wss: Server;

  handleConnection(client: Socket, ...args: any[]) {
    const token_auth = client.handshake.auth.access_token as string;
    const token_header = client.handshake.headers.authorization;
    let payload: UserPayload;
    try {
      payload = this.jwtService.verify(token_auth || token_header) as UserPayload;
      this.wsFiles.handleConnect(client, payload);
      client.emit('message', 'Welcome');
    } catch (error) {
      this.wsFiles.handleConnect(client, { sessionId: 'Guest', userId: 'Guest', isadmin: false, username: 'Guest' });
      return;
    }
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
