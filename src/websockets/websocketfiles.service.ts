import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Socket } from 'socket.io';
import { UserPayload } from 'src/auth/interfaces/userPayload.interface';
import { SystemService } from '../system/system.service';
import { UpdateFileEvent } from 'src/system/interfaces/updatefile.interface';

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

  private connections: Conections = {};

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
    this.system.addChangeTokenListener((data) => {
      const connectionsArray = Object.keys(this.connections);

      connectionsArray.forEach((idC) => {
        try {
          if (this.connections[idC].userId === data.userId) {
            this.connections[idC].client.emit('token-change', { path: data.path });
          }
          if (this.connections[idC].userId === 'Guest') {
            this.connections[idC].client.emit('token-change', { path: '' });
          }
        } catch (_err) {}
      });
    });
    this.system.addChangeMemoryMonitorListener(() => {
      const connectionsArray = Object.keys(this.connections);
      connectionsArray.forEach((idC) => {
        try {
          this.connections[idC].client.emit('memory-usage-update');
        } catch (_err) {}
      });
    });
    this.system.addChangeStatsUpdate(() => {
      const connectionsArray = Object.keys(this.connections);
      connectionsArray.forEach((idC) => {
        try {
          this.connections[idC].client.emit('stats-update');
        } catch (_err) {}
      });
    });
    this.system.addChangeUsersUpdate(() => {
      const connectionsArray = Object.keys(this.connections);
      connectionsArray.forEach((idC) => {
        try {
          this.connections[idC].client.emit('users-update');
        } catch (_err) {}
      });
    });

    this.system.addChangeFileUpdateListener((event) => {
      const connectionsArray = Object.keys(this.connections);
      connectionsArray.forEach((idC) => {
        try {
          if (this.connections[idC].userId !== event.userid) return;
          this.connections[idC].client.emit('file-update', event);
        } catch (_err) {}
      });
    });
    this.system.addChangeUpdateUploadListener((event) => {
      const connectionsArray = Object.keys(this.connections);
      connectionsArray.forEach((idC) => {
        try {
          if (this.connections[idC].userId !== event.userid) return;
          this.connections[idC].client.emit('upload-update', event);
        } catch (_err) {}
      });
    });
    this.system.addFileUploadRequestListener((event) => {
      const connectionsArray = Object.keys(this.connections);
      connectionsArray.forEach((idC) => {
        try {
          if (this.connections[idC].userId !== event) return;
          this.connections[idC].client.emit('file-upload', event);
        } catch (_err) {}
      });
    });
    this.system.addTreeUpdateListener((event) => {
      const connectionsArray = Object.keys(this.connections);
      connectionsArray.forEach((idC) => {
        try {
          if (this.connections[idC].userId !== event) return;
          this.connections[idC].client.emit('tree-update', event);
        } catch (_err) {}
      });
    });
    this.system.addChangeSessionsListener((userId: string) => {
      const connectionsArray = Object.keys(this.connections);
      connectionsArray.forEach((idC) => {
        try {
          if (this.connections[idC].user.userId !== userId) return;
          this.connections[idC].client.emit('sessions-update', userId);
        } catch (_err) {}
      });
    });
    this.system.addLogoutListener((sessionId) => {
      const connectionsArray = Object.keys(this.connections);
      connectionsArray.forEach((idC) => {
        try {
          if (this.connections[idC].user.sessionId !== sessionId) return;
          this.connections[idC].client.emit('message', 'Logout');
          this.handleDisconnect(this.connections[idC].client);
          this.connections[idC].client.disconnect();
        } catch (_err) {}
      });
    });
  }

  handleAuth(client: Socket, user: UserPayload) {
    this.connections[client.id]['user'] = user;
    this.connections[client.id]['userId'] = user.userId;
  }

  handleLogout(client: Socket) {
    this.connections[client.id]['user'] = { sessionId: 'Guest', userId: 'Guest', isadmin: false, username: 'Guest' };
    this.connections[client.id]['userId'] = 'Guest';
  }

  getUserInfo(clientId: string) {
    return this.connections[clientId].userId;
  }

  handleConnect(client: Socket, user: UserPayload) {
    this.connections[client.id] = { client, user, userId: user.userId };
  }

  handleDisconnect(client: Socket) {
    delete this.connections[client.id];
  }
}
