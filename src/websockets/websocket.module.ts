/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { WebSocketFilesService } from './websocketfiles.service';
import { SystemModule } from '../system/system.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [SystemModule, SessionsModule],
  providers: [WebSocketFilesService, WebsocketGateway]
})
export class WebSocketModule {}
