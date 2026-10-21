import { StatutOperationnel } from './roles';

/**
 * Doit rester strictement synchronisé avec l'enum `ModePaiement` de
 * `packages/database/prisma/schema.prisma` (cf. project.ts/client.ts pour la même raison).
 * `StatutOperationnel` est défini dans roles.ts (déjà partagé par tout le cycle de vie à 4 états).
 */
export enum ModePaiement {
  ESPECES = 'ESPECES',
  CHEQUE = 'CHEQUE',
  VIREMENT = 'VIREMENT',
  CARTE = 'CARTE',
  MOBILE = 'MOBILE',
  AUTRE = 'AUTRE',
}

export const LIBELLE_STATUT_OPERATIONNEL: Record<StatutOperationnel, string> = {
  [StatutOperationnel.BROUILLON]: 'Brouillon',
  [StatutOperationnel.SOUMIS]: 'Soumis',
  [StatutOperationnel.APPROUVE]: 'Approuvé',
  [StatutOperationnel.ENREGISTRE]: 'Enregistré',
  [StatutOperationnel.EXTOURNE]: 'Extourné',
};

export const LIBELLE_MODE_PAIEMENT: Record<ModePaiement, string> = {
  [ModePaiement.ESPECES]: 'Espèces',
  [ModePaiement.CHEQUE]: 'Chèque',
  [ModePaiement.VIREMENT]: 'Virement',
  [ModePaiement.CARTE]: 'Carte',
  [ModePaiement.MOBILE]: 'Paiement mobile',
  [ModePaiement.AUTRE]: 'Autre',
};

/** Catégories par défaut créées à l'inscription d'une nouvelle organisation (PRODUCT_SPEC.md §6). */
export const CATEGORIES_DEPENSE_PAR_DEFAUT = [
  'Matériaux',
  "Main-d'œuvre",
  'Location matériel',
  'Transport',
  'Carburant',
  'Sous-traitance',
  'Loyer',
  'Utilities',
  'Salaires',
  'CNSS/AMO',
  'Impôts et taxes',
  'Assurance',
  'Marketing',
  'Fournitures bureau',
  'Déplacement',
  'Repas',
  'Maintenance',
  'Autres',
] as const;
