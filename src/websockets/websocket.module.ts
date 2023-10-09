import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { WebSocketFilesService } from './websocketfiles.service';
import { SystemModule } from '../system/system.module'

@Module({
  imports: [SystemModule],
  providers: [WebSocketFilesService, WebsocketGateway]
})
export class WebSocketModule {}
