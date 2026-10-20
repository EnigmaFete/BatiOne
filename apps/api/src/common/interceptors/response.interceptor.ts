import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Enveloppe toute réponse succès au format standard (API_CONTRACTS.md §1.2). */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((donnees) => {
        if (donnees && typeof donnees === 'object' && 'succes' in donnees) {
          return donnees;
        }
        return { succes: true, donnees };
      }),
    );
  }
}
