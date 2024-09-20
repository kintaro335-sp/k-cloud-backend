/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiAcceptedResponse } from '@nestjs/swagger';
import { AppService, VersionResponse } from './app.service';

@Controller()
@ApiTags('root')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiAcceptedResponse({
    type: VersionResponse,
  })
  getHello() {
    return this.appService.getAbout();
  }
}
