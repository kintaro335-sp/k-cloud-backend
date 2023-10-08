import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { WebSocketFilesService } from './websocketfiles.service';

@Module({
  imports: [],
  providers: [WebSocketFilesService, WebsocketGateway]
})
export class WebSocketModule {}
