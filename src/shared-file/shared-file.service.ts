import { Injectable, NotFoundException } from '@nestjs/common';
// dto
import { ShareFileDTO } from './dtos/sharefile.dto';
// interfaces
import { UserPayload } from 'src/auth/interfaces/userPayload.interface';
// services
import { FilesService } from '../files/files.service';
import { TokenFilesService } from '../token-files/token-files.service';
import { UtilsService } from '../utils/utils.service';

@Injectable()
export class SharedFileService {
  constructor(
    private readonly filesService: FilesService,
    private readonly tokenService: TokenFilesService,
    private readonly utilsServ: UtilsService
  ) {}

  async share(path: string, user: UserPayload, metadata: ShareFileDTO) {
    if (!this.filesService.exists(path, user)) {
      throw new NotFoundException('File or Folder not Found');
    }
    const uuid = this.utilsServ.createIDSF();
    const isFolder = await this.filesService.isDirectoryUser(path, user);
    const fileProps = await this.filesService.getFilePropertiesUser(path, user);
    const expires = new Date(metadata.expire);
    this.tokenService.addSharedFile({
      id: uuid,
      createdAt: new Date(),
      doesexpires: metadata.expires,
      isdir: isFolder,
      expire: expires,
      owner: { connect: { id: user.userId } },
      name: fileProps.name,
      path
    });
    return { id: uuid };
  }
}
