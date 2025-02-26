/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

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
  ParseBoolPipe,
  HttpStatus,
  HttpCode,
  ForbiddenException
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';
// swagger
import { FileListResponse, FileResponse } from './responses/fileList.resp';
import { UsedSpaceTypeResp } from './responses/usedSpaceType.resp';
import { ErrorResponse } from '../responses/errorResponse.resp';
import { MessageResponse } from '../responses/messageResponse.resp';
import { ExistFileResponse } from './responses/existFile.resp';
import { IndexElementResponse } from './responses/indexElement.resp';
import { TreeResp } from './responses/tree.resp';
// services
import { FilesService } from './files.service';
import { TempStorageService } from '../temp-storage/temp-storage.service';
import { UtilsService } from '../utils/utils.service';
import { TreeFilesService } from '../treefiles/treeFiles.service';
// dtos
import { BlobFPDTO } from './dtos/blobfp.dto';
import { FileInitDTO } from './dtos/fileInit.dto';
import { RenameDTO } from './dtos/rename.dto';
import { MoveFileDTO } from './dtos/moceFile.dto';
import { MoveFilesDTO } from './dtos/moveFiles.dto';
import { DeleteFilesDTO } from './dtos/deletefiles.dto';
// guards
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SpaceGuard } from './guards/space.guard';
// interfaces
import { MessageResponseI } from '../auth/interfaces/response.interface';
import { ListFile, File, Folder, UsedSpaceType } from './interfaces/list-file.interface';
import { FilePTempResponse } from '../temp-storage/interfaces/filep.interface';
import { UserPayload } from '../auth/interfaces/userPayload.interface';
import { IndexList } from 'src/treefiles/interfaces/indexelement.interface';
// metadata
import { ScopesR } from '../auth/decorators/scopesR.decorator';
// mime
import { contentType } from 'mime-types';
import { join } from 'path';
import { FileTempResp } from './responses/fileTemp.resp';

@UseGuards(JwtAuthGuard)
@Controller('files')
@ApiTags('Files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly storageService: TempStorageService,
    private readonly utils: UtilsService,
    private readonly treeServ: TreeFilesService
  ) {}

  @Get('/stats/type')
  @ApiSecurity('t')
  @ScopesR(['files:read'])
  @ApiOkResponse({ type: [UsedSpaceTypeResp] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async userStats(@Request() req): Promise<UsedSpaceType[]> {
    const user = req.user as UserPayload;
    return this.filesService.getUsedSpaceByFileType(user.userId);
  }

  @Get('/list')
  @ApiSecurity('t')
  @ScopesR(['files:read'])
  @ApiOkResponse({ type: FileListResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async getAllFiles(@Response({ passthrough: true }) res, @Request() req): Promise<ListFile> {
    if (await this.filesService.isDirectoryUser('', req.user)) {
      return this.filesService.getListFiles('', req.user);
    }
    return { list: [] };
  }

  @Get('/list/*')
  @ApiSecurity('t')
  @ScopesR(['files:read'])
  @ApiParam({ name: '*', type: String })
  @ApiOkResponse({ type: FileListResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async getFiles(@Param() path: Record<any, string>, @Response({ passthrough: true }) res, @Request() req, @Query('d') downloadOpc) {
    const pathString = this.utils.processPath(path);

    if (await this.filesService.isDirectoryUser(pathString, req.user)) {
      return this.filesService.getListFiles(pathString, req.user);
    }
    const fileName = pathString.split('/').pop();
    const properties = await this.filesService.getFilePropertiesUser(pathString, req.user);
    const CD = Number(downloadOpc) === 1 ? 'attachment' : 'inline';
    const contentTypeHeader = contentType(fileName);
    res.set({
      'Content-Type': contentTypeHeader,
      'Content-Disposition': `${CD}; filename="${fileName}";`,
      'Content-Length': properties.size,
      'Keep-Alive': contentTypeHeader.toString().startsWith('video/') ? 'timeout=36000' : 'timeout=10'
    });
    return new StreamableFile(await this.filesService.getFile(pathString, req.user));
  }

  @Get('/properties/*')
  @ApiSecurity('t')
  @ScopesR(['files:read'])
  @ApiOkResponse({ type: FileResponse })
  async getFileProperties(@Param() path: Record<any, string>, @Request() req) {
    const pathString = this.utils.processPath(path);

    return this.filesService.getFileProperties(pathString, req.user);
  }

  @Post('/folder/*')
  @ApiSecurity('t')
  @ScopesR(['files:create'])
  @ApiParam({ name: '*', type: String })
  @ApiCreatedResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  async createFolder(@Param() path: Record<any, string>, @Request() req) {
    const pathString = this.utils.processPath(path);
    if (!(await this.filesService.exists(pathString, req.user))) {
      return this.filesService.createFolder(pathString, req.user);
    }
    throw new BadRequestException('diretorio ya existe');
  }

  @Post('upload/*')
  @ApiSecurity('t')
  @ScopesR(['files:create'])
  @ApiParam({ name: '*', type: String })
  @ApiCreatedResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FilesInterceptor('file', 1, { limits: { fileSize: 104857600 } }))
  async uploadFile(@Param() path: Record<any, string>, @Request() req, @UploadedFiles() file: Array<Express.Multer.File>) {
    const pathString = this.utils.processPath(path);
    return this.filesService.createFile(pathString, file[0], req.user);
  }

  @Post('upload/')
  @ApiSecurity('t')
  @ScopesR(['files:create'])
  @ApiCreatedResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FilesInterceptor('file', 1, { limits: { fileSize: 104857600 } }))
  async uploadFileS(@Request() req, @UploadedFiles() file: Array<Express.Multer.File>) {
    return this.filesService.createFile('', file[0], req.user);
  }

  @Post('initialize/*')
  @UseGuards(SpaceGuard)
  @ApiSecurity('t')
  @ScopesR(['files:create'])
  @ApiParam({ name: '*', type: String })
  @ApiCreatedResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  async initializeFile(
    @Param() path: Record<any, string>,
    @Body() body: FileInitDTO,
    @Query('overwrite', new ParseBoolPipe({ optional: true, errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) overwrite = false,
    @Request() req
  ): Promise<MessageResponseI> {
    const pathString = this.utils.processPath(path);
    const userId = req.user.userId;
    const pathStringC = join(userId, pathString);
    if (this.storageService.existsFile(pathStringC)) {
      throw new ForbiddenException('Archivo ya inicializado');
    }
    if ((await this.filesService.exists(pathString, req.user)) && !overwrite) {
      throw new BadRequestException('archivo ya existe');
    }
    if (overwrite) {
      await this.filesService.deleteFile(pathString, req.user);
    }
    this.storageService.createFileTemp(pathStringC, body.size, req.user, pathString);
    await this.filesService.reservateFileSpace(pathString, req.user, body.size);
    return { message: 'Inicializado' };
  }

  @Post('write/*')
  @ApiSecurity('t')
  @ScopesR(['files:create'])
  @ApiParam({ name: '*', type: String })
  @ApiCreatedResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FilesInterceptor('file'))
  async reciveBlob(
    @Param() path: Record<any, string>,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req,
    @Query('pos', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) position: number
  ): Promise<MessageResponseI> {
    if (files === undefined) {
      throw new BadRequestException('no file');
    }
    const fileM = files[0];
    const pathString = this.utils.processPath(path);
    const userId = req.user.userId;
    const pathStringC = join(userId, pathString);
    if (this.storageService.existsFile(pathStringC)) {
      this.storageService.allocateBlob(pathStringC, position, fileM.buffer);
      return { message: 'Blob Recived' };
    }
    throw new NotFoundException('Archivo no encontrado');
  }

  @Post('close/*')
  @HttpCode(200)
  @ApiSecurity('t')
  @ScopesR(['files:create'])
  @ApiParam({ name: '*', type: String })
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  async closeFile(@Param() path: Record<any, string>, @Request() req) {
    const pathString = this.utils.processPath(path);
    const userId = req.user.userId;
    const pathStringC = join(userId, pathString);
    if (this.storageService.isCompleted(pathStringC)) {
      this.storageService.delFile(pathString);
      return { message: 'closed File' };
    }
    return { message: 'not found' };
  }

  @Get('/status/*')
  @ApiSecurity('t')
  @ScopesR(['files:read'])
  @ApiParam({ name: '*', type: String })
  @ApiOkResponse({ type: FileTempResp })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async getFileStatusUpload(@Param() path: Record<any, string>, @Request() req): Promise<FilePTempResponse> {
    const pathString = this.utils.processPath(path);
    const userId = req.user.userId;
    const pathStringC = join(userId, pathString);

    if (!this.storageService.existsFile(pathStringC)) {
      throw new NotFoundException('File No encontrado');
    }
    return this.storageService.getFileStatus(pathStringC);
  }

  @Delete('/*')
  @ApiSecurity('t')
  @ScopesR(['files:delete'])
  @ApiParam({ name: '*', type: String })
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async deleteFile(@Param() path: Record<any, string>, @Request() req) {
    const pathString = this.utils.processPath(path);
    return this.filesService.deleteFile(pathString, req.user);
  }

  @Patch('deletemp/*')
  @ApiSecurity('t')
  @ScopesR(['files:delete'])
  @ApiParam({ name: '*', type: String })
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async deleteFiles(@Param() path: Record<any, string>, @Body() body: DeleteFilesDTO, @Request() req) {
    const pathString = this.utils.processPath(path);
    return this.filesService.deleteFiles(pathString, body.files, req.user);
  }

  @Get('exists/*')
  @ApiSecurity('t')
  @ScopesR(['files:read'])
  @ApiParam({ name: '*', type: String })
  @ApiOkResponse({ type: ExistFileResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async existsFile(@Param() path: Record<any, string>, @Request() req) {
    const pathString = this.utils.processPath(path);
    const exists = await this.filesService.exists(pathString, req.user);
    return { exists };
  }

  @Get('/index')
  @ApiSecurity('t')
  @ScopesR(['files:read'])
  @ApiQuery({ name: 's', type: String, required: false })
  @ApiOkResponse({ type: [IndexElementResponse] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async getindexRoot(@Request() req, @Query('s') searchCriteria: string = ''): Promise<IndexList> {
    if (searchCriteria !== '') {
      return this.treeServ.searchInIndex(req.user.userId, searchCriteria);
    }
    return this.treeServ.getIndexCache(req.user.userId);
  }

  @Get('/tree')
  @ApiSecurity('t')
  @ScopesR(['files:read'])
  @ApiOkResponse({ type: TreeResp })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async getTreeRoot(@Request() req): Promise<File | Folder> {
    const tree = await this.filesService.GetTreeC(req.user);
    if (tree.type === 'Folder') {
      tree.content = tree.content.filter((f) => f !== null);
      return tree;
    } else {
      return tree;
    }
  }

  @Patch('/tree')
  @ApiSecurity('t')
  @ScopesR(['files:read'])
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async updateTree(@Request() req): Promise<{ message: string }> {
    this.filesService.updateTree(req.user);
    return { message: 'Updating Tree' };
  }

  @Get('/tree/*')
  @ApiSecurity('t')
  @ScopesR(['files:read'])
  @ApiParam({ name: '*', type: String })
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async GetTree(@Param() path: Record<any, string>, @Request() req): Promise<File | Folder> {
    const pathString = this.utils.processPath(path);
    const tree = await this.filesService.GenerateTree(pathString, req.user, false, false);
    if (tree.type === 'Folder') {
      return tree;
    } else {
      return tree;
    }
  }

  @Get('zip/*')
  @ApiSecurity('t')
  @ScopesR(['files:read'])
  @ApiParam({ name: '*', type: String })
  @ApiOkResponse({ type: StreamableFile })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
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
  @HttpCode(200)
  @ApiSecurity('t')
  @ScopesR(['files:rename'])
  @ApiParam({ name: '*', type: String })
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async renameFile(@Param() path: string[], @Request() req, @Body() body: RenameDTO) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.filesService.renameFile(pathString, body.newName, req.user);
  }

  @Post('move/file/*')
  @HttpCode(200)
  @ApiSecurity('t')
  @ScopesR(['files:move'])
  @ApiParam({ name: '*', type: String })
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async moveFileFolder(@Param() path: string[], @Request() req, @Body() body: MoveFileDTO) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.filesService.moveFileFolder(pathString, body.newpath, req.user);
  }

  @Post('move/files/*')
  @HttpCode(200)
  @ApiSecurity('t')
  @ScopesR(['files:move'])
  @ApiParam({ name: '*', type: String })
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async moveFiles(@Param() path: string[], @Request() req, @Body() body: MoveFilesDTO) {
    const pathString = Object.keys(path)
      .map((key) => path[key])
      .join('/');
    return this.filesService.moveFiles(pathString, body.newPath, body.files, req.user);
  }
}
