import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UserPayload } from 'src/auth/interfaces/userPayload.interface';

@WebSocketGateway(5001, { cors: true })
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  


  @WebSocketServer() wss: Server;

  handleConnection(client: Socket, ...args: any[]) {}

  handleDisconnect(client: Socket) {}
}
