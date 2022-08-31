import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  constructor() {}

  onModuleInit() {}

  onModuleDestroy() {}
}
