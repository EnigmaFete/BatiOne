import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RoleUtilisateur } from '@batione/database';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Vérifie que `request.user.role` (posé par JwtAuthGuard/JwtStrategy, dérivé du JWT signé —
 * jamais d'un en-tête client) fait partie des rôles déclarés par `@Roles(...)` sur le handler.
 * Absence de `@Roles(...)` = aucune restriction de rôle (seule l'authentification s'applique).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleUtilisateur[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        code: 'ACCES_REFUSE',
        message: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
      });
    }

    return true;
  }
}
