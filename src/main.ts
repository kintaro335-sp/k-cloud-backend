/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import whiteList from './cors';
const cluster = process.env.APP_CLUSTER;
const port = process.env.PORT !== undefined ? Number(process.env.PORT) : 5000
const serveStatic = Boolean(process.env.SERVE_CLIENT);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({ credentials: true, origin: whiteList, methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' });
  // app.use(compression());
  app.use(cookieParser());
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
  if (serveStatic) {
    app.setGlobalPrefix('/api');
  }

  await app.listen(port);
}

// if (cluster === '1') {
//   AppClusterService.clustersize(bootstrap);
// } else {
//   bootstrap();
// }

bootstrap();
