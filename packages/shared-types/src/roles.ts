/**
 * Rôles métier BatiOne (ADR-009 — 11 valeurs : 10 rôles d'organisation + SUPERADMIN plateforme).
 * Doit rester strictement synchronisé avec l'enum `RoleUtilisateur` de `packages/database/prisma/schema.prisma`.
 */
export enum RoleUtilisateur {
  SUPERADMIN = 'SUPERADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  GESTIONNAIRE = 'GESTIONNAIRE',
  CONDUCTEUR_TRAVAUX = 'CONDUCTEUR_TRAVAUX',
  CHEF_CHANTIER = 'CHEF_CHANTIER',
  DAF_COMPTABLE = 'DAF_COMPTABLE',
  RH_PAIE = 'RH_PAIE',
  MAGASINIER = 'MAGASINIER',
  GESTIONNAIRE_MATERIEL = 'GESTIONNAIRE_MATERIEL',
  EMPLOYE = 'EMPLOYE',
  LECTEUR = 'LECTEUR',
}

export const ROLES_ORGANISATION: readonly RoleUtilisateur[] = [
  RoleUtilisateur.ORG_ADMIN,
  RoleUtilisateur.GESTIONNAIRE,
  RoleUtilisateur.CONDUCTEUR_TRAVAUX,
  RoleUtilisateur.CHEF_CHANTIER,
  RoleUtilisateur.DAF_COMPTABLE,
  RoleUtilisateur.RH_PAIE,
  RoleUtilisateur.MAGASINIER,
  RoleUtilisateur.GESTIONNAIRE_MATERIEL,
  RoleUtilisateur.EMPLOYE,
  RoleUtilisateur.LECTEUR,
];

export enum StatutOperationnel {
  BROUILLON = 'BROUILLON',
  SOUMIS = 'SOUMIS',
  APPROUVE = 'APPROUVE',
  ENREGISTRE = 'ENREGISTRE',
  EXTOURNE = 'EXTOURNE',
}
