/**
 * Doit rester strictement synchronisé avec l'enum `TypeMouvementStock` de
 * `packages/database/prisma/schema.prisma` (cf. project.ts pour la même raison).
 */
export enum TypeMouvementStock {
  ENTREE = 'ENTREE',
  SORTIE = 'SORTIE',
  AJUSTEMENT = 'AJUSTEMENT',
}

export const LIBELLE_TYPE_MOUVEMENT: Record<TypeMouvementStock, string> = {
  [TypeMouvementStock.ENTREE]: 'Entrée',
  [TypeMouvementStock.SORTIE]: 'Sortie',
  [TypeMouvementStock.AJUSTEMENT]: 'Ajustement',
};
