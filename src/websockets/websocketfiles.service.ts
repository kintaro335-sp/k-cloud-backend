import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Socket } from 'socket.io';
import { UserPayload } from 'src/auth/interfaces/userPayload.interface';
import { SystemService } from '../system/system.service';

interface Conections {
  [id: string]: {
    client: Socket;
    userId: string;
    user: UserPayload;
  };
}

@Injectable()
export class WebSocketFilesService implements OnApplicationBootstrap {
  constructor(private system: SystemService) {}

  private connections: Conections;

  onApplicationBootstrap() {
    this.system.addChangeFileListener((data) => {
      const connectionsArray = Object.keys(this.connections);

      connectionsArray.forEach((idC) => {
        try {
          if (this.connections[idC].userId === data.userId) {
            this.connections[idC].client.emit('file-change', { path: data.path });
          }
        } catch (_err) {}
      });
    });
  }

  handleConnect(client: Socket, user: UserPayload) {
    this.connections[client.id] = { client, user, userId: user.userId };
  }

  handleDisconnect(client: Socket) {
    delete this.connections[client.id];
  }
}
