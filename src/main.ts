import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import whiteList from './cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(compression());
  app.useGlobalPipes(new ValidationPipe());
  // app.use(cookieParser());
  // app.use(csurf({ cookie: { sameSite: true } }));
  app.enableCors({ credentials: true, origin: whiteList });
  await app.listen(5000);
}
bootstrap();
