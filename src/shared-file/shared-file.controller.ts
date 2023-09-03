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
import { TokenFilesService } from '../token-files/token-files.service';
import { contentType } from 'mime-types';

@Controller('shared-file')
export class SharedFileController {
  constructor(private readonly SFService: SharedFileService, private readonly tokenServ: TokenFilesService) {}

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

  @UseGuards(ExpireGuard)
  @Get('zip/:id')
  async downloadAsAZip(@Param('id') id: string, @Response({ passthrough: true }) res) {
    const streamFile = await this.SFService.downloadAsZipContent(id);
    const SFReg = await this.tokenServ.getSharedFileByID(id);

    res.set({
      'Content-Type': contentType(`${SFReg.name}.zip`),
      'Content-Disposition': `attachment; filename="${SFReg.name}.zip";`
    });
    return new StreamableFile(streamFile);
  }

  @UseGuards(ExpireGuard)
  @Get('zip/:id/*')
  async downloadAsAZipRoute(@Param('id') id: string, @Param() path: string[], @Response({ passthrough: true }) res) {
    const pathString = Object.keys(path)
      .filter((v) => v !== 'id')
      .map((key) => path[key])
      .join('/');
    const fileName = pathString.split('/').pop();
    const bufferFile = await this.SFService.downloadAsZipContent(id, pathString);
    // const SFReg = await this.tokenServ.getSharedFileByID(id);

    res.set({
      'Content-Type': contentType(`${fileName}.zip`),
      'Content-Disposition': `attachment; filename="${fileName}.zip";`
    });
    return new StreamableFile(bufferFile);
  }
  @UseGuards(JwtAuthGuard, OwnerShipGuard)
  @Delete('token/:id')
  async deleteToken(@Param('id') id: string) {
    return this.SFService.deleteToken(id);
  }

  @UseGuards(ExpireGuard)
  @Get('content/:id')
  async getSFcontent(@Param('id') id: string, @Response({ passthrough: true }) res, @Query('d') downloadOpc: number) {
    const SFReg = await this.SFService.getSFAllInfo(id);
    if (SFReg === null) throw new NotFoundException('not found');

    if (await this.SFService.isSFDirectory(SFReg, '')) {
      return this.SFService.getContentSFList(SFReg, '');
    } else {
      const fileProps = await this.SFService.getPropsSFFile(SFReg, '');
      const CD = downloadOpc === 1 ? 'attachment' : 'inline';
      res.set({
        'Content-Type': contentType(SFReg.name),
        'Content-Disposition': `${CD}; filename="${SFReg.name}";`,
        'Content-Length': fileProps.size
      });
      return new StreamableFile(await this.SFService.getContentSFFile(SFReg, ''));
    }
  }

  @UseGuards(ExpireGuard)
  @Get('content/:id/*')
  async getSFcontentPath(@Param('id') id: string, @Param() path: string[], @Response({ passthrough: true }) res, @Query('d') downloadOpc: number) {
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
      const CD = downloadOpc === 1 ? 'attachment' : 'inline';
      res.set({
        'Content-Type': contentType(fileProps.name),
        'Content-Disposition': `${CD}; filename="${fileProps.name}";`,
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

  @Get('tokens/user/page/:page')
  @UseGuards(JwtAuthGuard)
  async getTokensByUser(@Param('page', ParseIntPipe) page: number, @Request() req) {
    return this.SFService.getTokensByUser(req.user, page);
  }

  @Get('tokens/user/pages')
  @UseGuards(JwtAuthGuard)
  async getTokensPagesByUser(@Request() req) {
    const pages = await this.SFService.getPagesTokensByUser(req.user);
    return { pages };
  }

  @Post('tokens/user/:id')
  @UseGuards(JwtAuthGuard, OwnerShipGuard)
  async updateTokenByUser(@Param('id') id: string, @Body() body: ShareFileDTO) {
    return this.SFService.updateSFToken(id, body);
  }

  @UseGuards(JwtAuthGuard, OwnerShipGuard)
  @Get('tokens/user/content/:id')
  async getSFcontentUser(@Param('id') id: string, @Response({ passthrough: true }) res, @Query('d') downloadOpc: number) {
    const SFReg = await this.SFService.getSFAllInfo(id);
    if (SFReg === null) throw new NotFoundException('not found');

    if (await this.SFService.isSFDirectory(SFReg, '')) {
      return this.SFService.getContentSFList(SFReg, '');
    } else {
      const fileProps = await this.SFService.getPropsSFFile(SFReg, '');
      const CD = downloadOpc === 1 ? 'attachment' : 'inline';
      res.set({
        'Content-Type': contentType(SFReg.name),
        'Content-Disposition': `${CD}; filename="${SFReg.name}";`,
        'Content-Length': fileProps.size
      });
      return new StreamableFile(await this.SFService.getContentSFFile(SFReg, ''));
    }
  }

  @UseGuards(JwtAuthGuard, OwnerShipGuard)
  @Get('tokens/user/content/:id/*')
  async getSFcontentUserPath(
    @Param('id') id: string,
    @Param() path: string[],
    @Response({ passthrough: true }) res,
    @Query('d') downloadOpc: number
  ) {
    const SFReg = await this.SFService.getSFAllInfo(id);
    const pathString = Object.keys(path)
      .filter((v) => v !== 'id')
      .map((key) => path[key])
      .join('/');
    if (SFReg === null) throw new NotFoundException('not found');

    if (await this.SFService.isSFDirectory(SFReg, pathString)) {
      return this.SFService.getContentSFList(SFReg, pathString);
    } else {
      const fileProps = await this.SFService.getPropsSFFile(SFReg, pathString);
      const CD = downloadOpc === 1 ? 'attachment' : 'inline';
      res.set({
        'Content-Type': contentType(SFReg.name),
        'Content-Disposition': `${CD}; filename="${SFReg.name}";`,
        'Content-Length': fileProps.size
      });
      return new StreamableFile(await this.SFService.getContentSFFile(SFReg, pathString));
    }
  }
}
