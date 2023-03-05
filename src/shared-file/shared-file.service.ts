import { Injectable } from '@nestjs/common';
// services
import { FilesService } from '../files/files.service';
import { TokenFilesService } from '../token-files/token-files.service';

@Injectable()
export class SharedFileService {
  constructor(private readonly filesService: FilesService, private readonly tokenService: TokenFilesService) {}

  share(path:string, userid: string){}



}
