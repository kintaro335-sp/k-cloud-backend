import { Controller, Get, Post, Put, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// services
import { SharedFileService } from './shared-file.service';

@UseGuards(JwtAuthGuard)
@Controller('shared-file')
export class SharedFileController {
  constructor(private readonly SFService: SharedFileService) {}

  @Post('share/*')
  async share(@Param() path: string[], @Request() req){

  }
}
