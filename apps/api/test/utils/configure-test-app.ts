import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';

/**
 * Réplique exactement la configuration globale de `main.ts` (pipes, filtres, intercepteurs,
 * cookie-parser) sur une application de test — sans cela, les enveloppes de réponse standard et
 * le cookie de refresh ne sont jamais appliqués, et les tests échouent de façon trompeuse.
 */
export function configureTestApp(app: INestApplication): INestApplication {
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  return app;
}
