import { StatutOperationnel, LIBELLE_STATUT_OPERATIONNEL } from '@batione/shared-types';

const TENDANCE_PAR_STATUT: Record<StatutOperationnel, 'success' | 'warning' | 'danger' | 'info'> = {
  [StatutOperationnel.BROUILLON]: 'info',
  [StatutOperationnel.SOUMIS]: 'warning',
  [StatutOperationnel.APPROUVE]: 'warning',
  [StatutOperationnel.ENREGISTRE]: 'success',
  [StatutOperationnel.EXTOURNE]: 'danger',
};

export function StatutOperationnelBadge({ statut }: { statut: StatutOperationnel }) {
  return (
    <span className={`bo-badge bo-badge--${TENDANCE_PAR_STATUT[statut]}`}>{LIBELLE_STATUT_OPERATIONNEL[statut]}</span>
  );
}
