/**
 * Doit rester strictement synchronisé avec les enums `TypeProjet`/`StatutProjet` de
 * `packages/database/prisma/schema.prisma` (même raison que `roles.ts` : le frontend ne doit
 * jamais importer `@batione/database`, qui embarque du code serveur/Prisma).
 */
export enum TypeProjet {
  CONSTRUCTION = 'CONSTRUCTION',
  RENOVATION = 'RENOVATION',
  EVENEMENTIEL = 'EVENEMENTIEL',
  SERVICES = 'SERVICES',
  FOURNITURE = 'FOURNITURE',
  MAINTENANCE = 'MAINTENANCE',
  AUTRE = 'AUTRE',
}

export enum StatutProjet {
  BROUILLON = 'BROUILLON',
  ACTIF = 'ACTIF',
  EN_PAUSE = 'EN_PAUSE',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
}

export const LIBELLE_TYPE_PROJET: Record<TypeProjet, string> = {
  [TypeProjet.CONSTRUCTION]: 'Construction',
  [TypeProjet.RENOVATION]: 'Rénovation',
  [TypeProjet.EVENEMENTIEL]: 'Événementiel',
  [TypeProjet.SERVICES]: 'Services',
  [TypeProjet.FOURNITURE]: 'Fourniture',
  [TypeProjet.MAINTENANCE]: 'Maintenance',
  [TypeProjet.AUTRE]: 'Autre',
};

export const LIBELLE_STATUT_PROJET: Record<StatutProjet, string> = {
  [StatutProjet.BROUILLON]: 'Brouillon',
  [StatutProjet.ACTIF]: 'Actif',
  [StatutProjet.EN_PAUSE]: 'En pause',
  [StatutProjet.TERMINE]: 'Terminé',
  [StatutProjet.ANNULE]: 'Annulé',
};
