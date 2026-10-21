'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Wallet } from 'lucide-react';
import { StatutProjet, LIBELLE_TYPE_PROJET, type TypeProjet } from '@batione/shared-types';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { formatMAD, formatDateMA } from '@/lib/format';
import { ProjectStatusBadge } from '@/components/ProjectStatusBadge';

interface ProjetDetail {
  id: string;
  code: string;
  nom: string;
  type: TypeProjet;
  statut: StatutProjet;
  client_nom: string | null;
  budget: string;
  date_debut: string | null;
  date_fin_prevue: string | null;
  description: string | null;
  responsable: { id: string; nom: string; prenom: string } | null;
}

const ONGLETS = ['Aperçu', 'Financier', 'Tâches', 'Matériaux', 'Équipe', 'Matériel', 'Documents', 'Activité'];

export default function PageDetailProjet() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [projet, setProjet] = useState<ProjetDetail | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!moi) return;
    api
      .get<ProjetDetail>(`/projets/${id}`)
      .then(setProjet)
      .catch((err) => {
        if (err instanceof ApiError && err.code === 'RESSOURCE_INTROUVABLE') {
          setErreur('Ce projet est introuvable.');
        } else {
          setErreur('Impossible de charger ce projet.');
        }
      });
  }, [moi, id]);

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;

  if (erreur) {
    return (
      <div>
        <p className="bo-error-text">{erreur}</p>
        <Link href="/projets" className="bo-btn bo-btn--secondary">
          Retour aux projets
        </Link>
      </div>
    );
  }

  if (!projet) {
    return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push('/projets')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--batione-space-2)',
          color: 'var(--batione-ink-500)',
          fontSize: 'var(--batione-font-size-sm)',
          marginBottom: 'var(--batione-space-4)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <ArrowLeft size={16} aria-hidden />
        Retour aux projets
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 'var(--batione-space-5)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-3)' }}>
            <h1 style={{ fontSize: 'var(--batione-font-size-xl)', margin: 0 }}>{projet.nom}</h1>
            <ProjectStatusBadge statut={projet.statut} />
          </div>
          <p style={{ color: 'var(--batione-ink-500)', margin: '4px 0 0' }}>
            {projet.code} · {LIBELLE_TYPE_PROJET[projet.type]}
            {projet.client_nom ? ` · ${projet.client_nom}` : ''}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--batione-space-2)', marginBottom: 'var(--batione-space-5)', borderBottom: '1px solid var(--batione-ink-100)' }}>
        {ONGLETS.map((onglet, index) => (
          <button
            key={onglet}
            type="button"
            disabled={index !== 0}
            title={index !== 0 ? 'Bientôt disponible' : undefined}
            style={{
              padding: 'var(--batione-space-3) var(--batione-space-4)',
              background: 'none',
              border: 'none',
              borderBottom: index === 0 ? '2px solid var(--batione-primary)' : '2px solid transparent',
              color: index === 0 ? 'var(--batione-primary)' : 'var(--batione-ink-300)',
              fontWeight: index === 0 ? 600 : 400,
              fontSize: 'var(--batione-font-size-sm)',
              cursor: index === 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {onglet}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
        <div className="bo-card" style={{ flex: 2 }}>
          <h2 style={{ fontSize: 'var(--batione-font-size-lg)', marginTop: 0 }}>Résumé</h2>
          <p style={{ color: projet.description ? 'var(--batione-ink-800)' : 'var(--batione-ink-500)' }}>
            {projet.description ?? 'Aucune description pour ce projet.'}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--batione-space-4)',
              marginTop: 'var(--batione-space-5)',
              paddingTop: 'var(--batione-space-4)',
              borderTop: '1px solid var(--batione-ink-100)',
            }}
          >
            <InfoLigne icon={Wallet} libelle="Budget prévisionnel" valeur={formatMAD(projet.budget)} />
            <InfoLigne
              icon={User}
              libelle="Responsable"
              valeur={projet.responsable ? `${projet.responsable.prenom} ${projet.responsable.nom}` : 'Non assigné'}
            />
            <InfoLigne
              icon={Calendar}
              libelle="Date de début"
              valeur={projet.date_debut ? formatDateMA(new Date(projet.date_debut)) : 'Non définie'}
            />
            <InfoLigne
              icon={Calendar}
              libelle="Fin prévue"
              valeur={projet.date_fin_prevue ? formatDateMA(new Date(projet.date_fin_prevue)) : 'Non définie'}
            />
          </div>
        </div>

        <div className="bo-card" style={{ flex: 1 }}>
          <h2 style={{ fontSize: 'var(--batione-font-size-lg)', marginTop: 0 }}>Financier</h2>
          <p style={{ color: 'var(--batione-ink-500)', fontSize: 'var(--batione-font-size-sm)' }}>
            Revenus, dépenses et marge arriveront avec le module Finance.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoLigne({ icon: Icon, libelle, valeur }: { icon: typeof Wallet; libelle: string; valeur: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--batione-space-3)' }}>
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--batione-radius-md)',
          background: 'var(--batione-bg)',
          color: 'var(--batione-ink-500)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} aria-hidden />
      </span>
      <div>
        <p style={{ margin: 0, fontSize: 'var(--batione-font-size-xs)', color: 'var(--batione-ink-500)' }}>{libelle}</p>
        <p style={{ margin: 0, fontWeight: 600 }}>{valeur}</p>
      </div>
    </div>
  );
}
