import { FileText } from 'lucide-react';
import { ComingSoonModule } from '@/components/ComingSoonModule';

export default function PageClients() {
  return (
    <ComingSoonModule
      titre="Clients & Documents"
      description="Répertoire clients, devis, factures et génération de documents."
      icon={FileText}
      fonctionnalites={[
        'Fiche client (ICE, IF, RC, conditions de paiement, solde)',
        'Devis avec numérotation automatique et conversion en facture',
        'Factures conformes (ICE, TVA, coordonnées bancaires)',
        'Générateur de documents (contrats, attestations, bons) avec image de marque',
        'Partage par email/WhatsApp, relances automatiques',
        'Historique complet par client',
      ]}
    />
  );
}
