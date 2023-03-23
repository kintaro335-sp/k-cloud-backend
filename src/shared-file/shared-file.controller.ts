import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  Body,
  NotFoundException,
  Response,
  StreamableFile,
  Query,
  ParseIntPipe
} from '@nestjs/common';
// guards
import { OwnerShipGuard } from './ownership.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpireGuard } from './expire.guard';
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

  @UseGuards(ExpireGuard)
  @Get('info/:id')
  async getSFInfo(@Param('id') id: string) {
    return this.SFService.getSFInfo(id);
  }

  @UseGuards(JwtAuthGuard, OwnerShipGuard)
  @Delete(':id')
  async deleteToken(@Param('id') id: string) {
    return this.SFService.deleteToken(id);
  }

  @UseGuards(ExpireGuard)
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

  @UseGuards(ExpireGuard)
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
      return new StreamableFile(await this.SFService.getContentSFFile(SFReg, pathString));
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('tokens/path/*')
  async deleteTokensPath(@Param() path: string, @Request() req) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.SFService.removeTokensByPath(pathString, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tokens/path/*')
  async getTokensByPath(@Param() path: string, @Request() req) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.SFService.getTokensByPath(pathString, req.user);
  }

  @Get('tokens/list')
  async getTokensList(@Query('page', ParseIntPipe) page: number) {
    return this.SFService.getTokensList(page);
  }

  @Get('tokens/pages')
  async getTokensPages() {
    return { pages: await this.SFService.getTokensPages() };
  }
}
