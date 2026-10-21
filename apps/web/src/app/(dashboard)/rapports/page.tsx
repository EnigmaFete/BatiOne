import { BarChart3 } from 'lucide-react';
import { ComingSoonModule } from '@/components/ComingSoonModule';

export default function PageRapports() {
  return (
    <ComingSoonModule
      titre="Rapports"
      description="Analyses consolidées sur les projets, finances, stock et équipes."
      icon={BarChart3}
      fonctionnalites={[
        'Compte de résultat opérationnel et trésorerie',
        'Rentabilité par projet et par client',
        'Coût de main-d’œuvre et valorisation du stock',
        'Utilisation du matériel',
        'Créances et dettes échues',
        'Export Excel/PDF et constructeur de rapports personnalisés',
      ]}
    />
  );
}
