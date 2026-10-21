'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, FolderKanban } from 'lucide-react';
import { StatutProjet, LIBELLE_TYPE_PROJET, type TypeProjet } from '@batione/shared-types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { formatMAD, formatDateMA } from '@/lib/format';
import { ProjectStatusBadge } from '@/components/ProjectStatusBadge';

interface ProjetLigne {
  id: string;
  code: string;
  nom: string;
  type: TypeProjet;
  statut: StatutProjet;
  client: { id: string; nom: string } | null;
  budget: string;
  date_debut: string | null;
  responsable: { id: string; nom: string; prenom: string } | null;
}

interface ReponseListe {
  donnees: ProjetLigne[];
  metadonnees: { total: number };
}

export default function PageProjets() {
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [projets, setProjets] = useState<ProjetLigne[] | null>(null);
  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState<StatutProjet | ''>('');
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (recherche) params.set('recherche', recherche);
      if (statut) params.set('statut', statut);
      const reponse = await api.get<ReponseListe>(`/projets?${params.toString()}`);
      setProjets(reponse.donnees);
    } catch {
      setErreur('Impossible de charger les projets.');
    }
  }, [recherche, statut]);

  useEffect(() => {
    if (!moi) return;
    charger();
  }, [moi, charger]);

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--batione-space-5)',
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--batione-font-size-xl)', margin: 0 }}>Projets</h1>
          <p style={{ color: 'var(--batione-ink-500)', margin: '4px 0 0' }}>
            Tous vos chantiers, événements et missions en un seul endroit.
          </p>
        </div>
        <Link href="/projets/nouveau" className="bo-btn bo-btn--primary">
          <Plus size={18} aria-hidden />
          Nouveau projet
        </Link>
      </div>

      <div className="bo-card" style={{ marginBottom: 'var(--batione-space-4)', display: 'flex', gap: 'var(--batione-space-3)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={16}
            color="var(--batione-ink-500)"
            aria-hidden
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            className="bo-input"
            placeholder="Rechercher par nom, code ou client…"
            style={{ paddingLeft: 36 }}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <select
          className="bo-input"
          style={{ width: 200 }}
          value={statut}
          onChange={(e) => setStatut(e.target.value as StatutProjet | '')}
        >
          <option value="">Tous les statuts</option>
          {Object.values(StatutProjet).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {erreur && <p className="bo-error-text">{erreur}</p>}

      {projets === null ? (
        <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>
      ) : projets.length === 0 ? (
        <div className="bo-card bo-empty-state">
          <FolderKanban size={40} color="var(--batione-ink-300)" style={{ marginBottom: 'var(--batione-space-3)' }} aria-hidden />
          <p style={{ fontSize: 'var(--batione-font-size-lg)', fontWeight: 600, color: 'var(--batione-ink-800)' }}>
            {recherche || statut ? 'Aucun projet ne correspond à votre recherche' : 'Créez votre premier projet'}
          </p>
          <p>Suivez son budget, ses équipes, ses documents et sa rentabilité depuis une seule fiche.</p>
          <Link href="/projets/nouveau" className="bo-btn bo-btn--primary">
            Créer un projet
          </Link>
        </div>
      ) : (
        <div className="bo-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--batione-bg)', textAlign: 'left' }}>
                {['Code', 'Projet', 'Type', 'Client', 'Statut', 'Budget', 'Début', 'Responsable'].map((titre) => (
                  <th
                    key={titre}
                    style={{
                      padding: 'var(--batione-space-3) var(--batione-space-4)',
                      fontSize: 'var(--batione-font-size-xs)',
                      color: 'var(--batione-ink-500)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {titre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projets.map((projet) => (
                <tr
                  key={projet.id}
                  onClick={() => router.push(`/projets/${projet.id}`)}
                  style={{ borderTop: '1px solid var(--batione-ink-100)', cursor: 'pointer' }}
                >
                  <td style={cellStyle}>{projet.code}</td>
                  <td style={{ ...cellStyle, fontWeight: 600 }}>{projet.nom}</td>
                  <td style={cellStyle}>{LIBELLE_TYPE_PROJET[projet.type]}</td>
                  <td style={cellStyle}>{projet.client?.nom ?? '—'}</td>
                  <td style={cellStyle}>
                    <ProjectStatusBadge statut={projet.statut} />
                  </td>
                  <td style={cellStyle}>{formatMAD(projet.budget)}</td>
                  <td style={cellStyle}>{projet.date_debut ? formatDateMA(new Date(projet.date_debut)) : '—'}</td>
                  <td style={cellStyle}>
                    {projet.responsable ? `${projet.responsable.prenom} ${projet.responsable.nom}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  padding: 'var(--batione-space-3) var(--batione-space-4)',
  fontSize: 'var(--batione-font-size-sm)',
  color: 'var(--batione-ink-800)',
};
