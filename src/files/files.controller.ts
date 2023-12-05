import {
  Controller,
  Param,
  Get,
  Patch,
  StreamableFile,
  Response,
  Request,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFiles,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  Delete,
  Body,
  Query,
  ParseIntPipe,
  HttpStatus
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
// services
import { FilesService } from './files.service';
import { TempStorageService } from '../temp-storage/temp-storage.service';
import { UtilsService } from '../utils/utils.service';
// dtos
import { BlobFPDTO } from './dtos/blobfp.dto';
import { FileInitDTO } from './dtos/fileInit.dto';
import { RenameDTO } from './dtos/rename.dto';
import { MoveFileDTO } from './dtos/moceFile.dto';
import { MoveFilesDTO } from './dtos/moveFiles.dto';
// guards
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SpaceGuard } from './guards/space.guard';
// interfaces
import { MessageResponse } from '../auth/interfaces/response.interface';
import { ListFile, File, Folder, UsedSpaceType } from './interfaces/list-file.interface';
import { FilePTempResponse } from '../temp-storage/interfaces/filep.interface';
import { UserPayload } from '../auth/interfaces/userPayload.interface';
// mime
import { contentType } from 'mime-types';
import { join } from 'path';
// RXJS
import { Observable } from 'rxjs';
import { DeleteFilesDTO } from './dtos/deletefiles.dto';

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly storageService: TempStorageService,
    private readonly utils: UtilsService
  ) {}

  @Get('/stats/type')
  async userStats(@Request() req): Promise<UsedSpaceType[]> {
    const user = req.user as UserPayload;
    return this.filesService.getUsedSpaceByFileType(user.userId);
  }

  @Get('/list')
  async getAllFiles(@Response({ passthrough: true }) res, @Request() req): Promise<ListFile> {
    if (await this.filesService.isDirectoryUser('', req.user)) {
      return this.filesService.getListFiles('', req.user);
    }
    return { list: [] };
  }

  @Get('/list/*')
  async getFiles(@Param() path: string[], @Response({ passthrough: true }) res, @Request() req, @Query('d') downloadOpc) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    if (await this.filesService.isDirectoryUser(pathString, req.user)) {
      return this.filesService.getListFiles(pathString, req.user);
    }
    const fileName = pathString.split('/').pop();
    const properties = await this.filesService.getFilePropertiesUser(pathString, req.user);
    const CD = downloadOpc === 1 ? 'attachment' : 'inline';
    res.set({
      'Content-Type': contentType(fileName),
      'Content-Disposition': `${CD}; filename="${fileName}";`,
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

  @UseGuards(SpaceGuard)
  @Post('initialize/*')
  async initializeFile(@Param() path: string[], @Body() body: FileInitDTO, @Request() req): Promise<MessageResponse> {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    const userId = req.user.userId;
    const pathStringC = join(userId, pathString);
    if (this.filesService.exists(pathString, req.user)) {
      throw new BadRequestException('archivo ya existe');
    }
    if (this.storageService.existsFile(pathStringC)) {
      throw new BadRequestException('Archivo ya inicializado');
    }
    this.storageService.createFileTemp(pathStringC, body.size, req.user, pathString);
    return { message: 'Inicializado' };
  }

  @Post('writebase64/*')
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
    throw new NotFoundException('Archivo no encontrado');
  }

  @Post('write/*')
  @UseInterceptors(FilesInterceptor('file'))
  async reciveBlob(
    @Param() path: string[],
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req,
    @Query('pos', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) position: number
  ): Promise<MessageResponse> {
    if (files === undefined) {
      throw new BadRequestException('no file');
    }
    const fileM = files[0];
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    const userId = req.user.userId;
    const pathStringC = join(userId, pathString);
    if (this.storageService.existsFile(pathStringC)) {
      this.storageService.allocateBlob(pathStringC, position, fileM.buffer);
      return { message: 'Blob Recived' };
    }
    throw new NotFoundException('Archivo no encontrado');
  }

  @Post('close/*')
  async closeFile(@Param() path: string[], @Request() req) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    const userId = req.user.userId;
    const pathStringC = join(userId, pathString);
    if (this.storageService.isCompleted(pathStringC)) {
      this.storageService.delFile(pathString);
      return { message: 'closed File' };
    }
    return { message: 'not found' };
  }

  @Get('/status/*')
  async getFileStatusUpload(@Param() path: string[], @Request() req): Promise<FilePTempResponse> {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    const userId = req.user.userId;
    const pathStringC = join(userId, pathString);

    if (!this.storageService.existsFile(pathStringC)) {
      throw new NotFoundException('File No encontrado');
    }
    return this.storageService.getFileStatus(pathStringC);
  }

  @Get('/obs/status/*')
  getFileStatusUploadObs(@Param() path: string[], @Request() req): Observable<FilePTempResponse> {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    const userId = req.user.userId;
    const pathStringC = join(userId, pathString);

    if (!this.storageService.existsFile(pathStringC)) {
      throw new NotFoundException('File No encontrado');
    }

    return new Observable((subs) => {
      subs.next(this.storageService.getFileStatus(pathStringC));
    });
  }

  @Delete('/*')
  async deleteFile(@Param() path: string[], @Request() req) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.filesService.deleteFile(pathString, req.user);
  }

  @Patch('deletemp/*')
  async deleteFiles(@Param() path: string[], @Body() body: DeleteFilesDTO, @Request() req) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.filesService.deleteFiles(pathString, body.files, req.user);
  }

  @Get('/tree')
  async getTreeRoot(@Request() req) {
    return this.filesService.GenerateTree('', req.user, false, false);
  }

  @Get('/tree/*')
  async GetTree(@Param() path: string[], @Request() req): Promise<File | Folder> {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');

    return this.filesService.GenerateTree(pathString, req.user, false, false);
  }

  @Get('obs/tree')
  getTreeRootObs(@Request() req): Observable<File | Folder> {
    return new Observable((subs) => {
      this.filesService.GenerateTree('', req.user, false).then((arbol) => {
        subs.next(arbol);
      });
    });
  }

  @Get('obs/tree/*')
  GetTreeObs(@Param() path: string[], @Request() req): Observable<File | Folder> {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');

    return new Observable((subs) => {
      this.filesService.GenerateTree(pathString, req.user, false).then((arbol) => {
        subs.next(arbol);
      });
    });
  }

  @Get('zip/*')
  async DownloadZipFile(@Param() path: string[], @Request() req, @Response({ passthrough: true }) res) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    const fileName = pathString.split('/').pop();
    const streamZip = await this.filesService.getZipFromPathUser(pathString, req.user);
    res.set({
      'Content-Type': contentType(`${fileName}.zip`),
      'Content-Disposition': `attachment; filename="${fileName}.zip";`
    });
    return new StreamableFile(streamZip);
  }

  @Post('rename/*')
  async renameFile(@Param() path: string[], @Request() req, @Body() body: RenameDTO) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.filesService.renameFile(pathString, body.newName, req.user);
  }

  @Post('move/*')
  async moveFileFolder(@Param() path: string[], @Request() req, @Body() body: MoveFileDTO) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.filesService.moveFileFolder(pathString, body.newpath, req.user);
  }

  @Post('move/files/*')
  async moveFiles(@Param() path: string[], @Request() req, @Body() body: MoveFilesDTO) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.filesService.moveFiles(pathString, body.newPath, body.files, req.user);
  }
}
