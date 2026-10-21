/**
 * Doit rester strictement synchronisé avec l'enum `StatutEquipement` de
 * `packages/database/prisma/schema.prisma` (cf. project.ts pour la même raison).
 */
export enum StatutEquipement {
  DISPONIBLE = 'DISPONIBLE',
  AFFECTE = 'AFFECTE',
  MAINTENANCE = 'MAINTENANCE',
  HORS_SERVICE = 'HORS_SERVICE',
}

export const LIBELLE_STATUT_EQUIPEMENT: Record<StatutEquipement, string> = {
  [StatutEquipement.DISPONIBLE]: 'Disponible',
  [StatutEquipement.AFFECTE]: 'Affecté',
  [StatutEquipement.MAINTENANCE]: 'Maintenance',
  [StatutEquipement.HORS_SERVICE]: 'Hors service',
};
