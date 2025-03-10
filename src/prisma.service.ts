/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
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
    console.log(journal_mode);
    if (walModeENV && journal_mode !== 'wal') {
      await this.$queryRawUnsafe('PRAGMA journal_mode=WAL');
    }
    if(!walModeENV && journal_mode === 'wal') {
      await this.$queryRawUnsafe('PRAGMA journal_mode=DELETE');
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    //@ts-ignore
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
