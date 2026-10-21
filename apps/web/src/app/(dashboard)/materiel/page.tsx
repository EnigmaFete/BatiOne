import { Truck } from 'lucide-react';
import { ComingSoonModule } from '@/components/ComingSoonModule';

export default function PageMateriel() {
  return (
    <ComingSoonModule
      titre="Matériel"
      description="Parc matériel, affectations et coût d’utilisation par projet."
      icon={Truck}
      fonctionnalites={[
        'Fiche équipement (achat, valeur, état, documents)',
        'Affectation à un projet avec dates de départ et de retour',
        'Alertes sur les retours en retard',
        'Suivi de maintenance',
        'Refacturation interne du coût d’usage au projet',
        'Code QR pour identification rapide sur site',
      ]}
    />
  );
}
