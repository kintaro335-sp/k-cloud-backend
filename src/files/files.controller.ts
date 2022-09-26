import {
  Controller,
  Param,
  Get,
  StreamableFile,
  Response,
  Request,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFiles,
  InternalServerErrorException,
  Delete
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
// services
import { FilesService } from './files.service';
// guards
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// interfaces
import { ListFile } from './interfaces/list-file.interface';
// mime
import { contentType } from 'mime-types';

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('/list')
  async getAllFiles(@Response({ passthrough: true }) res, @Request() req): Promise<ListFile> {
    if (await this.filesService.isDirectoryUser('', req.user)) {
      return this.filesService.getListFiles('', req.user);
    }
    return { list: [] };
  }

  @Get('/list/*')
  async getFiles(@Param() path: string[], @Response({ passthrough: true }) res, @Request() req) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    if (await this.filesService.isDirectoryUser(pathString, req.user)) {
      return this.filesService.getListFiles(pathString, req.user);
    }
    const fileName = pathString.split('/').pop();
    const properties = await this.filesService.getFilePropertiesUser(pathString, req.user);
    res.set({
      'Content-Type': contentType(fileName),
      'Content-Disposition': `attachment; filename="${fileName}";`,
      'Content-Length': properties.size
    });
    return new StreamableFile(await this.filesService.getFile(pathString, req.user));
  }

  @Get('/properties/*')
  async getFileProperties(@Param() path: string[], @Request() req) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');

    return this.filesService.getFileProperties(pathString, req.user);
  }

  @Post('/folder/*')
  async createFolder(@Param() path: string[], @Request() req) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    if (!this.filesService.exists(pathString, req.user)) {
      return this.filesService.createFolder(pathString, req.user);
    }
    throw new InternalServerErrorException();
  }

  @Post('/*')
  @UseInterceptors(FilesInterceptor('file'))
  async uploadFile(@Param() path: string[], @Request() req, @UploadedFiles() file: Array<Express.Multer.File>) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.filesService.createFile(pathString, file[0], req.user);
  }

  @Post('/')
  @UseInterceptors(FilesInterceptor('file'))
  async uploadFileS(@Request() req, @UploadedFiles() file: Array<Express.Multer.File>) {
    return this.filesService.createFile('', file[0], req.user);
  }

  @Delete('/*')
  async deleteFile(@Param() path: string[], @Request() req) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.filesService.deleteFile(pathString, req.user);
  }

  @Get('/tree')
  async getTreeRoot(@Request() req) {
    return this.filesService.GenerateTree('', req.user, false);
  }

  @Get('/tree/*')
  async GetTree(@Param() path: string[], @Request() req) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');

    return this.filesService.GenerateTree(pathString, req.user, false);
  }
}
