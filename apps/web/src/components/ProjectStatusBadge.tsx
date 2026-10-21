import { StatutProjet, LIBELLE_STATUT_PROJET } from '@batione/shared-types';

const TENDANCE_PAR_STATUT: Record<StatutProjet, 'success' | 'warning' | 'danger' | 'info'> = {
  [StatutProjet.BROUILLON]: 'info',
  [StatutProjet.ACTIF]: 'success',
  [StatutProjet.EN_PAUSE]: 'warning',
  [StatutProjet.TERMINE]: 'info',
  [StatutProjet.ANNULE]: 'danger',
};

export function ProjectStatusBadge({ statut }: { statut: StatutProjet }) {
  return <span className={`bo-badge bo-badge--${TENDANCE_PAR_STATUT[statut]}`}>{LIBELLE_STATUT_PROJET[statut]}</span>;
}
