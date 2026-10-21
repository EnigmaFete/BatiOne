'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Wallet, PieChart, HardHat, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { formatMAD } from '@/lib/format';
import { KpiCard } from '@/components/KpiCard';
import { OnboardingChecklist, type EtapeOnboarding } from '@/components/OnboardingChecklist';
import { ConstructionIllustration } from '@/components/ConstructionIllustration';

const ETAPES_ONBOARDING: EtapeOnboarding[] = [
  { cle: 'profil', label: 'Profil de l’entreprise (ICE, logo, adresse)', fait: true },
  { cle: 'utilisateurs', label: 'Inviter votre équipe', fait: false },
  { cle: 'clients', label: 'Ajouter votre premier client', fait: false },
  { cle: 'projets', label: 'Créer votre premier projet', fait: false },
  { cle: 'ouvriers', label: 'Enregistrer vos collaborateurs', fait: false },
  { cle: 'stock', label: 'Ajouter vos premiers articles de stock', fait: false },
  { cle: 'materiel', label: 'Enregistrer votre matériel', fait: false },
  { cle: 'documents', label: 'Choisir vos modèles de documents', fait: false },
];

export default function PageTableauDeBord() {
  const { moi, erreur } = useAuth();
  const [nbProjetsActifs, setNbProjetsActifs] = useState<number | null>(null);

  useEffect(() => {
    if (!moi) return;
    api
      .get<{ metadonnees: { total: number } }>('/projets')
      .then((reponse) => setNbProjetsActifs(reponse.metadonnees.total))
      .catch(() => setNbProjetsActifs(0));
  }, [moi]);

  if (erreur) {
    return <p className="bo-error-text">{erreur}</p>;
  }

  if (!moi) {
    return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;
  }

  return (
    <div>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 'var(--batione-space-5)',
          padding: 'var(--batione-space-2) 0 var(--batione-space-4)',
        }}
      >
        <h1 style={{ fontSize: 'var(--batione-font-size-xl)', marginBottom: 4, position: 'relative', zIndex: 1 }}>
          Bonjour {moi.prenom} 👋
        </h1>
        <p style={{ color: 'var(--batione-ink-500)', margin: 0, position: 'relative', zIndex: 1 }}>
          {moi.organization.nom}
        </p>
        <ConstructionIllustration />
      </div>

      {!moi.organization.onboarding_complete && <OnboardingChecklist etapes={ETAPES_ONBOARDING} />}

      <div style={{ display: 'flex', gap: 'var(--batione-space-4)', marginBottom: 'var(--batione-space-5)' }}>
        <KpiCard icon={BarChart3} titre="Revenu encaissé" valeur={formatMAD(0)} tendance="info" sousTitre="Aucune donnée" />
        <KpiCard icon={Wallet} titre="Dépenses" valeur={formatMAD(0)} tendance="danger" sousTitre="Aucune donnée" />
        <KpiCard icon={PieChart} titre="Marge nette" valeur={formatMAD(0)} tendance="success" sousTitre="Aucune donnée" />
        <KpiCard
          icon={HardHat}
          titre="Projets actifs"
          valeur={nbProjetsActifs === null ? '…' : String(nbProjetsActifs)}
          tendance={nbProjetsActifs ? 'success' : 'warning'}
          sousTitre={nbProjetsActifs ? 'Voir les projets' : 'Créez votre premier projet'}
        />
      </div>

      {nbProjetsActifs === 0 && (
        <div className="bo-card bo-empty-state">
          <Building2 size={40} color="var(--batione-ink-300)" style={{ marginBottom: 'var(--batione-space-3)' }} aria-hidden />
          <p style={{ fontSize: 'var(--batione-font-size-lg)', fontWeight: 600, color: 'var(--batione-ink-800)' }}>
            Aucun projet pour le moment
          </p>
          <p>Créez votre premier projet pour commencer à suivre son budget, ses équipes et ses documents.</p>
          <Link href="/projets/nouveau" className="bo-btn bo-btn--primary">
            Créer un projet
          </Link>
        </div>
      )}
    </div>
  );
}
