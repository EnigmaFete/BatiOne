'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, definirJetonAcces, obtenirJetonAcces } from '@/lib/api';
import { formatMAD } from '@/lib/format';
import { KpiCard } from '@/components/KpiCard';

interface Moi {
  prenom: string;
  nom: string;
  role: string;
  organization: { nom: string; onboarding_complete: boolean };
}

const ETAPES_ONBOARDING = [
  { cle: 'profil', label: 'Profil de l’entreprise (ICE, logo, adresse)' },
  { cle: 'utilisateurs', label: 'Inviter votre équipe' },
  { cle: 'clients', label: 'Ajouter votre premier client' },
  { cle: 'projets', label: 'Créer votre premier projet' },
  { cle: 'ouvriers', label: 'Enregistrer vos collaborateurs' },
  { cle: 'stock', label: 'Ajouter vos premiers articles de stock' },
  { cle: 'materiel', label: 'Enregistrer votre matériel' },
  { cle: 'documents', label: 'Choisir vos modèles de documents' },
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
      <h1 style={{ fontSize: 'var(--batione-font-size-xl)', marginBottom: 4 }}>
        Bonjour {moi.prenom} 👋
      </h1>
      <p style={{ color: 'var(--batione-ink-500)', marginTop: 0 }}>{moi.organization.nom}</p>

      {!moi.organization.onboarding_complete && (
        <div className="bo-card" style={{ marginBottom: 'var(--batione-space-5)' }}>
          <h2 style={{ fontSize: 'var(--batione-font-size-lg)', marginTop: 0 }}>
            Finalisez la mise en route de votre espace
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {ETAPES_ONBOARDING.map((etape, index) => (
              <li
                key={etape.cle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--batione-space-3)',
                  padding: 'var(--batione-space-2) 0',
                  borderBottom:
                    index < ETAPES_ONBOARDING.length - 1 ? '1px solid var(--batione-ink-100)' : 'none',
                }}
              >
                <span
                  className={`bo-badge ${index === 0 ? 'bo-badge--success' : 'bo-badge--warning'}`}
                  style={{ minWidth: 70, justifyContent: 'center' }}
                >
                  {index === 0 ? 'Fait' : 'À faire'}
                </span>
                <span>{etape.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--batione-space-4)', marginBottom: 'var(--batione-space-5)' }}>
        <KpiCard titre="Revenu encaissé" valeur={formatMAD(0)} sousTitre="Aucune donnée" />
        <KpiCard titre="Dépenses" valeur={formatMAD(0)} sousTitre="Aucune donnée" />
        <KpiCard titre="Marge nette" valeur={formatMAD(0)} sousTitre="Aucune donnée" />
        <KpiCard titre="Projets actifs" valeur="0" tendance="warning" sousTitre="Créez votre premier projet" />
      </div>

      <div className="bo-card bo-empty-state">
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
