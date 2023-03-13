import { Controller, Get, Post, Put, Delete, Param, UseGuards, Request, Body, NotFoundException, Response, StreamableFile } from '@nestjs/common';
// guards
import { OwnerShipGuard } from './ownership.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// dto
import { ShareFileDTO } from './dtos/sharefile.dto';
// services
import { SharedFileService } from './shared-file.service';
import { contentType } from 'mime-types';

@Controller('shared-file')
export class SharedFileController {
  constructor(private readonly SFService: SharedFileService) {}

  @UseGuards(JwtAuthGuard)
  @Post('share/*')
  async share(@Param() path: string[], @Body() body: ShareFileDTO, @Request() req) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.SFService.share(pathString, req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('share/*')
  async GetTokens(@Param() path: string[], @Body() body: ShareFileDTO, @Request() req) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
  }

  @Get('info/:id')
  async getSFInfo(@Param('id') id: string) {
    return this.SFService.getSFInfo(id);
  }

  @UseGuards(JwtAuthGuard, OwnerShipGuard)
  @Delete(':id')
  async deleteToken(@Param('id') id: string) {
    return this.SFService.deleteToken(id);
  }

  @Get('content/:id')
  async getSFcontent(@Param('id') id: string, @Response({ passthrough: true }) res) {
    const SFReg = await this.SFService.getSFAllInfo(id);
    if (SFReg === null) throw new NotFoundException('not found');

    if (await this.SFService.isSFDirectory(SFReg, '')) {
      return this.SFService.getContentSFList(SFReg, '');
    } else {
      const fileProps = await this.SFService.getPropsSFFile(SFReg, '');
      res.set({
        'Content-Type': contentType(SFReg.name),
        'Content-Disposition': `attachment; filename="${SFReg.name}";`,
        'Content-Length': fileProps.size
      });
      return new StreamableFile(await this.SFService.getContentSFFile(SFReg, ''));
    }
  }

  @Get('content/:id/*')
  async getSFcontentPath(@Param('id') id: string, @Param() path: string[], @Response({ passthrough: true }) res) {
    const pathString = Object.keys(path)
      .filter((v) => v !== 'id')
      .map((key) => path[key])
      .join('/');
    const SFReg = await this.SFService.getSFAllInfo(id);
    if (SFReg === null) throw new NotFoundException('not found');

    if (await this.SFService.isSFDirectory(SFReg, pathString)) {
      return this.SFService.getContentSFList(SFReg, pathString);
    } else {
      const fileProps = await this.SFService.getPropsSFFile(SFReg, pathString);
      res.set({
        'Content-Type': contentType(SFReg.name),
        'Content-Disposition': `attachment; filename="${SFReg.name}";`,
        'Content-Length': fileProps.size
      });
      return new StreamableFile(await this.SFService.getContentSFFile(SFReg, ''));
    }
  }
}
