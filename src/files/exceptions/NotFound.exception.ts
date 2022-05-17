import{ HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundException extends HttpException {
  constructor() {
    super('File/Directorie Not Found', HttpStatus.NOT_FOUND);
  }
}