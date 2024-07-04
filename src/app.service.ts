import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAbout() {
    return {
      app: 'k-cloud-backend',
      version: 'v1.0.0'
    };
  }
}
