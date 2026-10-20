'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Wallet, PieChart, HardHat, Building2 } from 'lucide-react';
import { api, ApiError, definirJetonAcces, obtenirJetonAcces } from '@/lib/api';
import { formatMAD } from '@/lib/format';
import { KpiCard } from '@/components/KpiCard';
import { OnboardingChecklist, type EtapeOnboarding } from '@/components/OnboardingChecklist';
import { ConstructionIllustration } from '@/components/ConstructionIllustration';

interface Moi {
  prenom: string;
  nom: string;
  role: string;
  organization: { nom: string; onboarding_complete: boolean };
}

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
  const router = useRouter();
  const [moi, setMoi] = useState<Moi | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    async function charger() {
      if (!obtenirJetonAcces()) {
        try {
          const { accessToken } = await api.post<{ accessToken: string }>('/auth/rafraichir');
          definirJetonAcces(accessToken);
        } catch {
          router.replace('/connexion');
          return;
        }
      }
      try {
        const donnees = await api.get<Moi>('/auth/moi');
        setMoi(donnees);
      } catch (err) {
        if (err instanceof ApiError) {
          router.replace('/connexion');
        } else {
          setErreur('Impossible de charger le tableau de bord.');
        }
      }
    }
    charger();
  }, [router]);

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
        <KpiCard icon={HardHat} titre="Projets actifs" valeur="0" tendance="warning" sousTitre="Créez votre premier projet" />
      </div>

      <div className="bo-card bo-empty-state">
        <Building2 size={40} color="var(--batione-ink-300)" style={{ marginBottom: 'var(--batione-space-3)' }} aria-hidden />
        <p style={{ fontSize: 'var(--batione-font-size-lg)', fontWeight: 600, color: 'var(--batione-ink-800)' }}>
          Aucun projet pour le moment
        </p>
        <p>Créez votre premier projet pour commencer à suivre son budget, ses équipes et ses documents.</p>
        <button className="bo-btn bo-btn--primary" disabled>
          Créer un projet (bientôt disponible)
        </button>
      </div>
    </div>
  );
}
