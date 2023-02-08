import{ HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundException extends HttpException {
  constructor(path?: string) {
    super(`File/Directorie Not Found in ${path}`, HttpStatus.NOT_FOUND);
  }
}