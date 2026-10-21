import { StatutEquipement, LIBELLE_STATUT_EQUIPEMENT } from '@batione/shared-types';

const TENDANCE_PAR_STATUT: Record<StatutEquipement, 'success' | 'warning' | 'danger' | 'info'> = {
  [StatutEquipement.DISPONIBLE]: 'success',
  [StatutEquipement.AFFECTE]: 'info',
  [StatutEquipement.MAINTENANCE]: 'warning',
  [StatutEquipement.HORS_SERVICE]: 'danger',
};

export function StatutEquipementBadge({ statut }: { statut: StatutEquipement }) {
  return <span className={`bo-badge bo-badge--${TENDANCE_PAR_STATUT[statut]}`}>{LIBELLE_STATUT_EQUIPEMENT[statut]}</span>;
}
