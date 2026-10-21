/**
 * Doit rester strictement synchronisé avec les enums `TypeClient`/`ConditionsPaiement` de
 * `packages/database/prisma/schema.prisma` (cf. project.ts pour la même raison : le frontend ne
 * doit jamais importer `@batione/database`).
 */
export enum TypeClient {
  PARTICULIER = 'PARTICULIER',
  ENTREPRISE = 'ENTREPRISE',
  ENTITE_PUBLIQUE = 'ENTITE_PUBLIQUE',
}

export enum ConditionsPaiement {
  COMPTANT = 'COMPTANT',
  A_15_JOURS = 'A_15_JOURS',
  A_30_JOURS = 'A_30_JOURS',
  A_60_JOURS = 'A_60_JOURS',
  A_90_JOURS = 'A_90_JOURS',
}

export const LIBELLE_TYPE_CLIENT: Record<TypeClient, string> = {
  [TypeClient.PARTICULIER]: 'Particulier',
  [TypeClient.ENTREPRISE]: 'Entreprise',
  [TypeClient.ENTITE_PUBLIQUE]: 'Entité publique',
};

export const LIBELLE_CONDITIONS_PAIEMENT: Record<ConditionsPaiement, string> = {
  [ConditionsPaiement.COMPTANT]: 'Comptant',
  [ConditionsPaiement.A_15_JOURS]: '15 jours',
  [ConditionsPaiement.A_30_JOURS]: '30 jours',
  [ConditionsPaiement.A_60_JOURS]: '60 jours',
  [ConditionsPaiement.A_90_JOURS]: '90 jours',
};
