import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(compression());
  app.useGlobalPipes(new ValidationPipe());
  // app.use(cookieParser());
  // app.use(csurf({ cookie: { sameSite: true } }));
  app.enableCors({ credentials: true, origin: ['http://192.168.50.181:3000', 'http://localhost:3000'] });
  await app.listen(5000);
}
bootstrap();
