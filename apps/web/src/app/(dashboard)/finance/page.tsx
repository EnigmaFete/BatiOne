import { Landmark } from 'lucide-react';
import { ComingSoonModule } from '@/components/ComingSoonModule';

export default function PageFinance() {
  return (
    <ComingSoonModule
      titre="Finance"
      description="Encaissements, dépenses, primes et contrôle budgétaire."
      icon={Landmark}
      fonctionnalites={[
        'Encaissements clients (acomptes, paiements partiels, moyens de paiement)',
        'Dépenses avec catégories personnalisables et justificatifs',
        'Circuit d’approbation (brouillon → soumis → approuvé → enregistré)',
        'Primes aux ouvriers, séparées des dépenses courantes',
        'Soldes clients/fournisseurs, balance âgée',
        'Export comptable Excel/CSV/PDF',
      ]}
    />
  );
}
