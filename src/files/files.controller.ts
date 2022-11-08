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
  BadRequestException,
  Delete,
  Body
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
// services
import { FilesService } from './files.service';
import { TempStorageService } from '../temp-storage/temp-storage.service';
import { UtilsService } from '../utils/utils.service';
// dtos
import { BlobFPDTO } from './dtos/blobfp.dto';
import { FileInitDTO } from './dtos/fileInit.dto';
// guards
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// interfaces
import { MessageResponse } from '../auth/interfaces/response.interface';
import { ListFile } from './interfaces/list-file.interface';
// mime
import { contentType } from 'mime-types';
import { join } from 'path';

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly storageService: TempStorageService,
    private readonly utils: UtilsService
  ) {}

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

  @Post('upload/*')
  @UseInterceptors(FilesInterceptor('file', 1, { limits: { fileSize: 104857600 } }))
  async uploadFile(@Param() path: string[], @Request() req, @UploadedFiles() file: Array<Express.Multer.File>) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.filesService.createFile(pathString, file[0], req.user);
  }

  @Post('upload/')
  @UseInterceptors(FilesInterceptor('file', 1, { limits: { fileSize: 104857600 } }))
  async uploadFileS(@Request() req, @UploadedFiles() file: Array<Express.Multer.File>) {
    return this.filesService.createFile('', file[0], req.user);
  }

  @Post('initialize/*')
  async initializeFile(@Param() path: string[], @Body() body: FileInitDTO, @Request() req): Promise<MessageResponse> {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    const userId = req.user.userId;
    const pathStringC = join(userId, pathString);
    if (this.filesService.exists(pathString, req.user)) {
      throw new BadRequestException('ya existe');
    }
    if (this.storageService.existsFile(pathStringC)) {
      throw new BadRequestException('Ya inicializado');
    }
    this.storageService.createFileTemp(pathStringC, body.size);
    return { message: 'Inicializado' };
  }

  @Post('write/*')
  async allocateBase64Blob(@Param() path: string[], @Body() body: BlobFPDTO, @Request() req): Promise<MessageResponse> {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    const userId = req.user.userId;
    const pathStringC = join(userId, pathString);
    if (this.storageService.existsFile(pathStringC)) {
      this.storageService.allocateBlob(pathStringC, body.position, this.utils.base64ToBuffer(body.blob));
      return { message: 'Blob Recived' };
    }

    return { message: 'Archivo no existe' };
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
