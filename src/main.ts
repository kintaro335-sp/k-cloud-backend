import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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
  await app.listen(5000);
}

if (cluster === '1') {
  AppClusterService.clustersize(bootstrap);
} else {
  bootstrap();
}
