import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  // CORS_ORIGIN accepte une liste séparée par des virgules (ex. localhost pour le poste de dev
  // + l'IP locale du réseau pour tester depuis un téléphone sur le même Wi-Fi).
  const originsAutorisees = (process.env.CORS_ORIGIN ?? 'http://localhost:4000')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: originsAutorisees,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const port = process.env.API_PORT ?? 4001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`BatiOne API démarrée sur http://localhost:${port}/api/v1`);
}

bootstrap();
