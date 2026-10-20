import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

interface ErreurPayload {
  code?: string;
  message?: string | string[];
  champs?: unknown;
}

/**
 * Convertit toute exception en enveloppe d'erreur standard (API_CONTRACTS.md §1.3).
 * Ne laisse JAMAIS fuiter une erreur technique brute (stack trace, message Prisma) vers le
 * client — cf. UX principles : "Never show raw database errors to users".
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'ERREUR_INTERNE';
    let message = "Une erreur inattendue s'est produite. Veuillez réessayer.";
    let champs: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const payload = body as ErreurPayload;
        code = payload.code ?? this.defaultCodeForStatus(statusCode);
        message = Array.isArray(payload.message) ? payload.message.join(' ') : payload.message ?? message;
        champs = payload.champs;
      }
    } else {
      this.logger.error(`Erreur non gérée sur ${request.method} ${request.url}`, (exception as Error)?.stack);
    }

    response.status(statusCode).json({
      succes: false,
      erreur: {
        code,
        message,
        ...(champs ? { champs } : {}),
        horodatage: new Date().toISOString(),
      },
    });
  }

  private defaultCodeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'REQUETE_INVALIDE';
      case HttpStatus.UNAUTHORIZED:
        return 'NON_AUTHENTIFIE';
      case HttpStatus.FORBIDDEN:
        return 'ACCES_REFUSE';
      case HttpStatus.NOT_FOUND:
        return 'RESSOURCE_INTROUVABLE';
      case HttpStatus.CONFLICT:
        return 'CONFLIT';
      default:
        return 'ERREUR_INTERNE';
    }
  }
}
