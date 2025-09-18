/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {

  async onModuleInit() {
    const walModeENV = process.env.DATABASE_WAL === '1';

    await this.$connect()
    const result = await this.$queryRawUnsafe('PRAGMA journal_mode');
    const journal_mode = result[0].journal_mode;
    if (walModeENV && journal_mode !== 'wal') {
      await this.$queryRawUnsafe('PRAGMA journal_mode=WAL;');
      await this.$executeRawUnsafe(`PRAGMA wal_autocheckpoint = 500;`);
      await this.$executeRawUnsafe(`PRAGMA synchronous = NORMAL;`);
    }
    if(!walModeENV && journal_mode === 'wal') {
      await this.$queryRawUnsafe('PRAGMA journal_mode=DELETE;');
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    //@ts-ignore
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
