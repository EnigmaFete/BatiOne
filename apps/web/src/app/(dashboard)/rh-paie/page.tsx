import { Users } from 'lucide-react';
import { ComingSoonModule } from '@/components/ComingSoonModule';

export default function PageRhPaie() {
  return (
    <ComingSoonModule
      titre="RH & Paie"
      description="Collaborateurs, pointage et paie marocaine."
      icon={Users}
      fonctionnalites={[
        'Fiches collaborateurs (CIN, CNSS, type de contrat, RIB)',
        'Pointage quotidien (présence, absences, heures supplémentaires)',
        'Moteur de paie marocain paramétrable (CNSS, AMO, IR) — jamais de taux codé en dur',
        'Bulletins de paie en français et arabe, génération en lot',
        'Acomptes sur salaire et imputation au coût du projet',
        'Déclarations CNSS/AMO/IR',
      ]}
    />
  );
}
