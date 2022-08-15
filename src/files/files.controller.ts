import { Controller, Param, Get, StreamableFile, Response, Request, UseGuards } from '@nestjs/common';
// services
import { FilesService } from './files.service';
// guards
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// mime
import { contentType } from 'mime-types';

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  async getAllFiles(@Response({ passthrough: true }) res) {
    if (this.filesService.isDirectory('')) {
      return this.filesService.getListFiles('');
    }
    res.set({
      'Content-Type': contentType(this.filesService.getRoot())
    });
    return this.filesService.getFile('');
  }

  @Get('/*')
  async getFiles(@Param() path: string[], @Response({ passthrough: true }) res) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    if (this.filesService.isDirectory(pathString)) {
      return this.filesService.getListFiles(pathString);
    }
    const fileName = pathString.split('/').pop();
    res.set({
      'Content-Type': contentType(fileName)
    });
    return new StreamableFile(await this.filesService.getFile(pathString));
  }
}
