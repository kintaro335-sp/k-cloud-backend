/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// dto
import { ShareFileDTO } from './dtos/sharefile.dto';
import { ShareFilesDTO } from './dtos/sharefiles.dto';
// interfaces
import { UserPayload } from 'src/auth/interfaces/userPayload.interface';
import { SFInfoResponse } from './interfaces/SFInfo.interface';
import { TokenElement } from './interfaces/TokenElement.interface';
// services
import { FilesService } from '../files/files.service';
import { TokenFilesService } from '../token-files/token-files.service';
import { UtilsService } from '../utils/utils.service';
import { Sharedfile } from '@prisma/client';
import { join } from 'path';
import { contentType, lookup } from 'mime-types';
import { SystemService } from '../system/system.service';
import { LogsService } from 'src/logs/logs.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SharedFileService {
  constructor(
    private readonly filesService: FilesService,
    private readonly tokenService: TokenFilesService,
    private readonly utilsServ: UtilsService,
    private system: SystemService,
    private logService: LogsService
  ) {}

  private async getFName(path: string, user: UserPayload) {
    if (await this.filesService.isDirectoryUser(path, user)) {
      return path.split('/').pop();
    } else {
      const fileProps = await this.filesService.getFilePropertiesUser(path, user);
      return fileProps.name;
    }
  }

  async shareFiles(path: string, user: UserPayload, metadata: ShareFilesDTO) {
    if (!this.filesService.isDirectoryUser(path, user)) {
      throw new BadRequestException('path is a file');
    }
    const files = metadata.files;
    const ids = await Promise.all(
      files.map(async (file) => {
        const uuid = this.utilsServ.createIDSF();
        const pathComplete = join(path, file);
        const isFolder = await this.filesService.isDirectoryUser(pathComplete, user);
        const nameF = await this.getFName(pathComplete, user);
        const expires = new Date(metadata.expire);
        await this.tokenService.addSharedFile({
          id: uuid,
          createdAt: new Date(),
          doesexpires: metadata.expires,
          isdir: isFolder,
          expire: expires,
          public: metadata.public,
          owner: { connect: { id: user.userId } },
          name: nameF,
          path: pathComplete
        });
        this.system.emitChangeTokenEvent({ path, userId: user.userId });
        return uuid;
      })
    );
    return ids.filter((i) => i !== null);
  }

  async share(path: string, user: UserPayload, metadata: ShareFileDTO): Promise<{ id: string }> {
    if (!this.filesService.exists(path, user)) {
      throw new NotFoundException('File or Folder not Found');
    }
    let uuid = Boolean(metadata.id) ? metadata.id : this.utilsServ.createIDSF();
    const isFolder = await this.filesService.isDirectoryUser(path, user);
    const nameF = await this.getFName(path, user);
    const expires = new Date(metadata.expire);
    if (Boolean(metadata.id) && (await this.tokenService.existsTokenById(metadata.id))) {
      uuid = user.username + '-' + uuid;
    }
    await this.tokenService.addSharedFile({
      id: uuid,
      createdAt: new Date(),
      doesexpires: metadata.expires,
      isdir: isFolder,
      expire: expires,
      public: metadata.public,
      owner: { connect: { id: user.userId } },
      name: nameF,
      path
    });
    const pathEmit = path.split('/');
    pathEmit.pop();
    this.system.emitChangeFileEvent({ path: pathEmit.join('/'), userId: user.userId });
    this.system.emitChangeTokenEvent({ path: pathEmit.join('/'), userId: user.userId });
    return { id: uuid };
  }

  async getSFInfo(id: string): Promise<SFInfoResponse> {
    const SFReg = await this.tokenService.getSharedFileByID(id);
    if (SFReg === null) {
      throw new NotFoundException('File not found');
    }

    const realPath = join(SFReg.userid, SFReg.path);
    const exists = await this.filesService.exists(SFReg.path, { sessionId: '', isadmin: true, userId: SFReg.userid, username: '' });
    if (!exists) {
      this.tokenService.removeSharedFile(id);
      this.system.emitChangeTokenEvent({ path: SFReg.path, userId: SFReg.userid });
      throw new NotFoundException();
    }
    const size = await this.filesService.getFileSize(realPath, true);

    return {
      type: SFReg.isdir ? 'folder' : 'file',
      name: SFReg.name,
      mime_type: lookup(SFReg.name) || '',
      size,
      expire: SFReg.doesexpires,
      expires: SFReg.expire.getTime(),
      createdAt: SFReg.createdAt.getTime()
    };
  }

  async getSFAllInfo(id: string) {
    return this.tokenService.getSharedFileByID(id);
  }

  async isSFDirectory(SFReg: Sharedfile, path: string): Promise<boolean> {
    if (SFReg === null) {
      throw new NotFoundException('File not found');
    }
    const user: UserPayload = { sessionId: '', isadmin: false, userId: SFReg.userid, username: SFReg.id };
    const pseudoPath = join(SFReg.path, path);
    return this.filesService.isDirectoryUser(pseudoPath, user);
  }

  async getContentSFList(SFReg: Sharedfile, path: string) {
    if (SFReg === null) {
      throw new NotFoundException('File not found');
    }
    const user: UserPayload = { sessionId: '', isadmin: false, userId: SFReg.userid, username: SFReg.id };
    const pseudoPath = join(SFReg.path, path);
    return this.filesService.getListFiles(pseudoPath, user);
  }

  async getContentSFFile(SFReg: Sharedfile, path: string) {
    if (SFReg === null) {
      throw new NotFoundException('File not found');
    }
    const user: UserPayload = { sessionId: '', isadmin: false, userId: SFReg.userid, username: SFReg.id };
    const pseudoPath = join(SFReg.path, path);
    return this.filesService.getFile(pseudoPath, user);
  }

  async getContentSFFileChunk(SFReg: Sharedfile, path: string, start:number, end: number) {
    if (SFReg === null) {
      throw new NotFoundException('File not found');
    }
    const user: UserPayload = { sessionId: '', isadmin: false, userId: SFReg.userid, username: SFReg.id };
    const pseudoPath = join(SFReg.path, path);
    return this.filesService.getFileChunk(pseudoPath, user, start, end);
  }

  async getPropsSFFile(SFReg: Sharedfile, path: string) {
    if (SFReg === null) {
      throw new NotFoundException('File not found');
    }
    const user: UserPayload = { sessionId: '', isadmin: false, userId: SFReg.userid, username: SFReg.id };
    const pseudoPath = join(SFReg.path, path);
    return this.filesService.getFilePropertiesUser(pseudoPath, user);
  }

  async removeTokensByPath(path: string, user: UserPayload) {
    await this.tokenService.deleteTokensByPath(path, user.userId);
    const pathEmit = path.split('/');
    pathEmit.pop();
    this.system.emitChangeTokenEvent({ path: pathEmit.join('/'), userId: user.userId });
    return { message: 'deleted tokens' };
  }

  async deleteToken(id: string) {
    const token = await this.tokenService.getSharedFileByID(id);
    const pathEmit = token.path.split('/');
    pathEmit.pop();
    await this.tokenService.removeSharedFile(id);
    this.system.emitChangeFileEvent({ path: pathEmit.join('/'), userId: token.userid });
    this.system.emitChangeTokenEvent({ path: pathEmit.join('/'), userId: token.userid });
    return { message: 'deleted' };
  }

  async deleteTokens(tokensIds: string[], userPayload: UserPayload) {
    const { userId } = userPayload;
    const deletedTokens = tokensIds.map(async (tokenId) => {
      const token = await this.tokenService.getSharedFileByID(tokenId);
      if (token === null) return null;

      if (token.userid === userId) {
        await this.tokenService.removeSharedFile(tokenId);
        await this.logService.createLog({
          id: uuidv4(),
          action: 'DELETE',
          date: new Date(),
          path: token.path,
          reason: 'NONE',
          tokenid: tokenId,
          user: userId,
          status: 'ALLOWED'
        });
      } else {
        await this.logService.createLog({
          id: uuidv4(),
          action: 'DELETE',
          date: new Date(),
          path: token.path,
          reason: 'WRONG_OWNER',
          tokenid: tokenId,
          user: userId,
          status: 'DENIED'
        });
      }
      return tokenId;
    });
    this.system.emitChangeTokenEvent({ path: '', userId: userId });
    return Promise.all(deletedTokens);
  }

  async getTokensByPath(path: string, user: UserPayload): Promise<TokenElement[]> {
    const tokens = await this.tokenService.getSharedFilesByPathUserID(path, user.userId);
    return tokens.map((sf) => ({
      id: sf.id,
      name: sf.name,
      type: sf.isdir ? 'folder' : 'file',
      mime_type: contentType(sf.name) || '',
      publict: sf.public,
      expire: sf.doesexpires,
      expires: sf.expire.getTime()
    }));
  }

  async getTokensList(page: number): Promise<TokenElement[]> {
    const sharedFiles = await this.tokenService.getSharedFiles(page - 1);

    return sharedFiles.map((sf) => ({
      id: sf.id,
      type: sf.isdir ? 'folder' : 'file',
      name: sf.name,
      mime_type: contentType(sf.name) || '',
      publict: sf.public,
      expire: sf.doesexpires,
      expires: sf.expire.getTime()
    }));
  }

  async downloadAsZipContent(id: string, pathS: string = ''): Promise<Buffer> {
    const SFReg = await this.tokenService.getSharedFileByID(id);
    if (SFReg === null) {
      throw new NotFoundException('Not Found');
    }
    const path = join(SFReg.userid, SFReg.path, pathS);
    return this.filesService.getZipFromPathUser(path, null);
  }

  async getTokensPages(): Promise<number> {
    return this.tokenService.getCountSharedPages();
  }

  // with auth

  async getTokensByUser(user: UserPayload, page: number): Promise<TokenElement[]> {
    const tokens = await this.tokenService.getTokensByUser(user.userId, page - 1);

    return tokens.map((token) => ({
      id: token.id,
      type: token.isdir ? 'folder' : 'file',
      name: token.name,
      mime_type: contentType(token.name) || '',
      publict: token.public,
      expire: token.doesexpires,
      expires: token.expire.getTime()
    }));
  }

  async getPagesTokensByUser(user: UserPayload) {
    return this.tokenService.getPagesNumberByUser(user.userId);
  }

  async updateSFToken(id: string, newTokenInfo: ShareFileDTO) {
    const token = await this.tokenService.updateSF(id, {
      expire: new Date(newTokenInfo.expire),
      public: newTokenInfo.public,
      doesexpires: newTokenInfo.expires
    });
    const pathEmit = token.path.split('/');
    pathEmit.pop();
    this.system.emitChangeTokenEvent({ path: pathEmit.join('/'), userId: token.userid });
    return { message: 'token Updated' };
  }
}
