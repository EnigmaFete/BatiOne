import { SetMetadata } from '@nestjs/common';
import { RoleUtilisateur } from '@batione/database';

export const ROLES_KEY = 'roles';

/** Déclare les rôles autorisés sur un handler/contrôleur — vérifié par `RolesGuard`. */
export const Roles = (...roles: RoleUtilisateur[]) => SetMetadata(ROLES_KEY, roles);
