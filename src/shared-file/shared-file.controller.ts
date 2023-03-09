import { Controller, Get, Post, Put, Param, Query, UseGuards, Request, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// dto
import { ShareFileDTO } from './dtos/sharefile.dto';
// services
import { SharedFileService } from './shared-file.service';

@UseGuards(JwtAuthGuard)
@Controller('shared-file')
export class SharedFileController {
  constructor(private readonly SFService: SharedFileService) {}

  @Post('share/*')
  async share(@Param() path: string[], @Body() body: ShareFileDTO, @Request() req) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.SFService.share(pathString, req.user, body);
  }
}
