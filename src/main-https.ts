/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppClusterService } from './app-cluster.service';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import whiteList from './cors';
import { readFileSync } from 'fs';

async function bootstrap() {
  const httpskey = readFileSync(process.env.SSL_KEY_PATH);
  const httpscert = readFileSync(process.env.SSL_CERT_PATH);
  const passphrase = process.env.SSL_PASSPHRASE;

  const app = await NestFactory.create(AppModule, { httpsOptions: { key: httpskey, cert: httpscert, passphrase } });

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({ credentials: true, origin: whiteList });
  app.use(compression());
  await app.listen(5000);
}

bootstrap();
