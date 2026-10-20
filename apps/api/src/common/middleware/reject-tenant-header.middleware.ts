import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * Rejette toute requête portant un en-tête `X-Tenant-ID` avant qu'elle n'atteigne un contrôleur.
 * Le contexte tenant ne provient JAMAIS d'un en-tête fourni par le client (cf. ADR-017,
 * SECURITY_MODEL.md §1.2) — uniquement du JWT authentifié, vérifié par signature.
 */
@Injectable()
export class RejectTenantHeaderMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    if (req.headers['x-tenant-id'] !== undefined) {
      throw new BadRequestException({
        code: 'TENANT_HEADER_NOT_ALLOWED',
        message:
          "L'en-tête X-Tenant-ID n'est pas autorisé. Le contexte d'organisation est dérivé exclusivement du jeton d'authentification.",
      });
    }
    next();
  }
}
