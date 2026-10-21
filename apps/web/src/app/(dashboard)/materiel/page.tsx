'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Truck } from 'lucide-react';
import { StatutEquipement } from '@batione/shared-types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { StatutEquipementBadge } from '@/components/StatutEquipementBadge';

interface EquipementLigne {
  id: string;
  code: string;
  nom: string;
  categorie: string | null;
  statut: StatutEquipement;
  cout_horaire_interne: string;
}

interface ReponseListe {
  donnees: EquipementLigne[];
  metadonnees: { total: number };
}

export default function PageMateriel() {
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [equipements, setEquipements] = useState<EquipementLigne[] | null>(null);
  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState<StatutEquipement | ''>('');
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (recherche) params.set('recherche', recherche);
      if (statut) params.set('statut', statut);
      const reponse = await api.get<ReponseListe>(`/equipement?${params.toString()}`);
      setEquipements(reponse.donnees);
    } catch {
      setErreur('Impossible de charger le matériel.');
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
          <h1 style={{ fontSize: 'var(--batione-font-size-xl)', margin: 0 }}>Matériel</h1>
          <p style={{ color: 'var(--batione-ink-500)', margin: '4px 0 0' }}>
            Parc matériel et affectations aux projets.
          </p>
        </div>
        <Link href="/materiel/nouveau" className="bo-btn bo-btn--primary">
          <Plus size={18} aria-hidden />
          Nouvel équipement
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
            placeholder="Rechercher par code ou nom…"
            style={{ paddingLeft: 36 }}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <select className="bo-input" style={{ width: 220 }} value={statut} onChange={(e) => setStatut(e.target.value as StatutEquipement | '')}>
          <option value="">Tous les statuts</option>
          {Object.values(StatutEquipement).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {erreur && <p className="bo-error-text">{erreur}</p>}

      {equipements === null ? (
        <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>
      ) : equipements.length === 0 ? (
        <div className="bo-card bo-empty-state">
          <Truck size={40} color="var(--batione-ink-300)" style={{ marginBottom: 'var(--batione-space-3)' }} aria-hidden />
          <p style={{ fontSize: 'var(--batione-font-size-lg)', fontWeight: 600, color: 'var(--batione-ink-800)' }}>
            {recherche || statut ? 'Aucun équipement ne correspond à votre recherche' : 'Ajoutez votre premier équipement'}
          </p>
          <p>Suivez vos affectations de matériel par projet.</p>
          <Link href="/materiel/nouveau" className="bo-btn bo-btn--primary">
            Ajouter un équipement
          </Link>
        </div>
      ) : (
        <div className="bo-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--batione-bg)', textAlign: 'left' }}>
                {['Code', 'Nom', 'Catégorie', 'Statut', 'Coût horaire'].map((titre) => (
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
              {equipements.map((equipement) => (
                <tr
                  key={equipement.id}
                  onClick={() => router.push(`/materiel/${equipement.id}`)}
                  style={{ borderTop: '1px solid var(--batione-ink-100)', cursor: 'pointer' }}
                >
                  <td style={{ ...cellStyle, fontWeight: 600 }}>{equipement.code}</td>
                  <td style={cellStyle}>{equipement.nom}</td>
                  <td style={cellStyle}>{equipement.categorie ?? '—'}</td>
                  <td style={cellStyle}>
                    <StatutEquipementBadge statut={equipement.statut} />
                  </td>
                  <td style={cellStyle}>{Number(equipement.cout_horaire_interne).toLocaleString('fr-FR')} MAD/h</td>
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
