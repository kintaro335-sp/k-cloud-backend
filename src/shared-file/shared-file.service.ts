import { Injectable, NotFoundException } from '@nestjs/common';
// dto
import { ShareFileDTO } from './dtos/sharefile.dto';
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

@Injectable()
export class SharedFileService {
  constructor(
    private readonly filesService: FilesService,
    private readonly tokenService: TokenFilesService,
    private readonly utilsServ: UtilsService
  ) {}

  private async getFName(path: string, user: UserPayload) {
    if (await this.filesService.isDirectoryUser(path, user)) {
      return path.split('/').pop();
    } else {
      const fileProps = await this.filesService.getFilePropertiesUser(path, user);
      return fileProps.name;
    }
  }

  async share(path: string, user: UserPayload, metadata: ShareFileDTO): Promise<{ id: string }> {
    if (!this.filesService.exists(path, user)) {
      throw new NotFoundException('File or Folder not Found');
    }
    const uuid = this.utilsServ.createIDSF();
    const isFolder = await this.filesService.isDirectoryUser(path, user);
    const nameF = await this.getFName(path, user);
    const expires = new Date(metadata.expire);
    await this.tokenService.addSharedFile({
      id: uuid,
      createdAt: new Date(),
      doesexpires: metadata.expires,
      isdir: isFolder,
      expire: expires,
      owner: { connect: { id: user.userId } },
      name: nameF,
      path
    });

    return { id: uuid };
  }

  async getSFInfo(id: string): Promise<SFInfoResponse> {
    const SFReg = await this.tokenService.getSharedFileByID(id);
    if (SFReg === null) {
      throw new NotFoundException('File not found');
    }

    return {
      type: SFReg.isdir ? 'folder' : 'file',
      name: SFReg.name,
      expire: SFReg.doesexpires,
      expires: SFReg.expire.getTime()
    };
  }

  async getSFAllInfo(id: string) {
    return this.tokenService.getSharedFileByID(id);
  }

  async isSFDirectory(SFReg: Sharedfile, path: string): Promise<boolean> {
    if (SFReg === null) {
      throw new NotFoundException('File not found');
    }
    const user: UserPayload = { isadmin: false, userId: SFReg.userid, username: SFReg.id };
    const pseudoPath = join(SFReg.path, path);
    return this.filesService.isDirectoryUser(pseudoPath, user);
  }

  async getContentSFList(SFReg: Sharedfile, path: string) {
    if (SFReg === null) {
      throw new NotFoundException('File not found');
    }
    const user: UserPayload = { isadmin: false, userId: SFReg.userid, username: SFReg.id };
    const pseudoPath = join(SFReg.path, path);
    return this.filesService.getListFiles(pseudoPath, user);
  }

  async getContentSFFile(SFReg: Sharedfile, path: string) {
    if (SFReg === null) {
      throw new NotFoundException('File not found');
    }
    const user: UserPayload = { isadmin: false, userId: SFReg.userid, username: SFReg.id };
    const pseudoPath = join(SFReg.path, path);
    return this.filesService.getFile(pseudoPath, user);
  }

  async getPropsSFFile(SFReg: Sharedfile, path: string) {
    if (SFReg === null) {
      throw new NotFoundException('File not found');
    }
    const user: UserPayload = { isadmin: false, userId: SFReg.userid, username: SFReg.id };
    const pseudoPath = join(SFReg.path, path);
    return this.filesService.getFilePropertiesUser(pseudoPath, user);
  }

  async removeTokensByPath(path: string, user: UserPayload) {
    await this.tokenService.deleteTokensByPath(path, user.userId);
    return { message: 'deleted tokens' };
  }

  async deleteToken(id: string) {
    await this.tokenService.removeSharedFile(id);
    return { message: 'deleted' };
  }

  async getTokensByPath(path: string, user: UserPayload): Promise<TokenElement[]> {
    const tokens = await this.tokenService.getSharedFilesByPathUserID(path, user.userId);
    return tokens.map((sf) => ({
      id: sf.id,
      name: sf.name,
      type: sf.isdir ? 'folder' : 'file',
      expire: sf.doesexpires,
      expires: sf.expire.getTime()
    }));
  }

  async getTokensList(page: number): Promise<TokenElement[]> {
    const sharedFiles = await this.tokenService.getSharedFiles(page);

    return sharedFiles.map((sf) => ({
      id: sf.id,
      type: sf.isdir ? 'folder' : 'file',
      name: sf.name,
      expire: sf.doesexpires,
      expires: sf.expire.getTime()
    }));
  }

  async getTokensPages(): Promise<number> {
    return this.tokenService.getCountSharedPages();
  }
}
