/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppClusterService } from './app-cluster.service';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import whiteList from './cors';
const cluster = process.env.APP_CLUSTER;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({ credentials: true, origin: whiteList });
  app.use(compression());
    const config = new DocumentBuilder()
    .setTitle('k-cloud-backend')
    .setDescription('NAS API')
    .setVersion('1.0')
    .addServer('', 'base')
    .addServer('/api', 'api prefix')
    .addSecurity('t', { type: 'apiKey', in: 'query', name: 't' })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, document);

  await app.listen(5000);
}

if (cluster === '1') {
  AppClusterService.clustersize(bootstrap);
} else {
  bootstrap();
}
