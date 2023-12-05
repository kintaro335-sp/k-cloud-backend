import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAbout() {
    return {
      app: 'k-cloud-backend',
      version: 'v0.9.0'
    };
  }
}
