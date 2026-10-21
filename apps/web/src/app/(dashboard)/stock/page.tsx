import { Package } from 'lucide-react';
import { ComingSoonModule } from '@/components/ComingSoonModule';

export default function PageStock() {
  return (
    <ComingSoonModule
      titre="Stock"
      description="Articles, mouvements de stock et consommation par projet."
      icon={Package}
      fonctionnalites={[
        'Catalogue d’articles avec seuils d’alerte',
        'Entrées, sorties et transferts entre dépôts',
        'Quantité disponible par article et par dépôt, en temps réel',
        'Consommation de matériaux par projet',
        'Historique des mouvements avec justificatifs photo',
        'Import/export Excel',
      ]}
    />
  );
}
