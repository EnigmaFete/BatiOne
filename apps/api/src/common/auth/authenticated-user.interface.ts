import { RoleUtilisateur } from '@batione/database';

/** Forme du payload JWT validé, posée sur `request.user` par `JwtStrategy`. */
export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
  role: RoleUtilisateur;
  email: string;
}
