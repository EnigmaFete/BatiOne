'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StatutEquipement } from '@batione/shared-types';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { formatDateMA } from '@/lib/format';
import { StatutEquipementBadge } from '@/components/StatutEquipementBadge';

interface AffectationLigne {
  id: string;
  date_debut: string;
  date_retour_prevu: string | null;
  date_retour_reel: string | null;
  notes: string | null;
  project: { id: string; code: string; nom: string };
}

interface EquipementDetail {
  id: string;
  code: string;
  nom: string;
  categorie: string | null;
  statut: StatutEquipement;
  cout_horaire_interne: string;
  notes: string | null;
  affectations: AffectationLigne[];
}

interface ProjetOption {
  id: string;
  code: string;
  nom: string;
}

export default function PageDetailEquipement() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [equipement, setEquipement] = useState<EquipementDetail | null>(null);
  const [projets, setProjets] = useState<ProjetOption[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState(false);
  const [afficherFormulaireAffectation, setAfficherFormulaireAffectation] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [dateDebut, setDateDebut] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateRetourPrevu, setDateRetourPrevu] = useState('');

  const charger = useCallback(() => {
    api
      .get<EquipementDetail>(`/equipement/${id}`)
      .then(setEquipement)
      .catch((err) => {
        if (err instanceof ApiError && err.code === 'RESSOURCE_INTROUVABLE') {
          setErreur('Cet équipement est introuvable.');
        } else {
          setErreur('Impossible de charger cet équipement.');
        }
      });
  }, [id]);

  useEffect(() => {
    if (!moi) return;
    charger();
    api
      .get<{ donnees: ProjetOption[] }>('/projets')
      .then((r) => setProjets(r.donnees))
      .catch(() => setProjets([]));
  }, [moi, charger]);

  async function affecter(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setActionEnCours(true);
    try {
      await api.post(`/equipement/${id}/affectations`, {
        projectId,
        dateDebut,
        dateRetourPrevu: dateRetourPrevu || undefined,
      });
      setAfficherFormulaireAffectation(false);
      setProjectId('');
      setDateRetourPrevu('');
      charger();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Impossible d'affecter cet équipement.");
    } finally {
      setActionEnCours(false);
    }
  }

  async function retourner(assignmentId: string) {
    setErreur(null);
    setActionEnCours(true);
    try {
      await api.post(`/equipement/${id}/affectations/${assignmentId}/retour`);
      charger();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Impossible d'enregistrer le retour.");
    } finally {
      setActionEnCours(false);
    }
  }

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;

  if (erreur && !equipement) {
    return (
      <div>
        <p className="bo-error-text">{erreur}</p>
        <Link href="/materiel" className="bo-btn bo-btn--secondary">
          Retour au matériel
        </Link>
      </div>
    );
  }

  if (!equipement) {
    return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;
  }

  const affectationEnCours = equipement.affectations.find((a) => !a.date_retour_reel);

  return (
    <div style={{ maxWidth: 820 }}>
      <button
        type="button"
        onClick={() => router.push('/materiel')}
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
        Retour au matériel
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--batione-space-5)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-3)' }}>
            <h1 style={{ fontSize: 'var(--batione-font-size-xl)', margin: 0 }}>{equipement.nom}</h1>
            <StatutEquipementBadge statut={equipement.statut} />
          </div>
          <p style={{ color: 'var(--batione-ink-500)', margin: '4px 0 0' }}>
            {equipement.code} · {equipement.categorie ?? 'Sans catégorie'}
          </p>
        </div>
      </div>

      <div className="bo-card" style={{ marginBottom: 'var(--batione-space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--batione-space-4)' }}>
          <div>
            <p style={{ margin: 0, fontSize: 'var(--batione-font-size-xs)', color: 'var(--batione-ink-500)' }}>Coût horaire interne</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{Number(equipement.cout_horaire_interne).toLocaleString('fr-FR')} MAD/h</p>
          </div>
          {affectationEnCours && (
            <div>
              <p style={{ margin: 0, fontSize: 'var(--batione-font-size-xs)', color: 'var(--batione-ink-500)' }}>Affecté depuis</p>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {affectationEnCours.project.code} · {affectationEnCours.project.nom} ({formatDateMA(new Date(affectationEnCours.date_debut))})
              </p>
            </div>
          )}
        </div>
        {equipement.notes && (
          <div style={{ marginTop: 'var(--batione-space-4)', paddingTop: 'var(--batione-space-4)', borderTop: '1px solid var(--batione-ink-100)' }}>
            <p style={{ fontSize: 'var(--batione-font-size-xs)', color: 'var(--batione-ink-500)', margin: '0 0 4px' }}>Notes</p>
            <p style={{ margin: 0 }}>{equipement.notes}</p>
          </div>
        )}
      </div>

      {erreur && <p className="bo-error-text">{erreur}</p>}

      {equipement.statut === StatutEquipement.DISPONIBLE && !afficherFormulaireAffectation && (
        <button type="button" className="bo-btn bo-btn--primary" onClick={() => setAfficherFormulaireAffectation(true)} style={{ marginBottom: 'var(--batione-space-5)' }}>
          Affecter à un projet
        </button>
      )}

      {affectationEnCours && (
        <button
          type="button"
          className="bo-btn bo-btn--secondary"
          disabled={actionEnCours}
          onClick={() => retourner(affectationEnCours.id)}
          style={{ marginBottom: 'var(--batione-space-5)' }}
        >
          {actionEnCours ? 'Enregistrement…' : 'Enregistrer le retour'}
        </button>
      )}

      {afficherFormulaireAffectation && (
        <form onSubmit={affecter} className="bo-card" style={{ marginBottom: 'var(--batione-space-5)' }}>
          <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
            <div className="bo-field" style={{ flex: 1 }}>
              <label className="bo-label" htmlFor="projectId">
                Projet
              </label>
              <select id="projectId" className="bo-input" required value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="" disabled>
                  Choisir un projet
                </option>
                {projets?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="bo-field" style={{ flex: 1 }}>
              <label className="bo-label" htmlFor="dateDebut">
                Date de début
              </label>
              <input
                id="dateDebut"
                className="bo-input"
                type="date"
                required
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>
            <div className="bo-field" style={{ flex: 1 }}>
              <label className="bo-label" htmlFor="dateRetourPrevu">
                Retour prévu <span style={{ fontWeight: 400, color: 'var(--batione-ink-500)' }}>(optionnel)</span>
              </label>
              <input
                id="dateRetourPrevu"
                className="bo-input"
                type="date"
                value={dateRetourPrevu}
                onChange={(e) => setDateRetourPrevu(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--batione-space-3)' }}>
            <button type="submit" className="bo-btn bo-btn--primary" disabled={actionEnCours}>
              {actionEnCours ? 'Affectation…' : 'Confirmer l’affectation'}
            </button>
            <button type="button" className="bo-btn bo-btn--secondary" onClick={() => setAfficherFormulaireAffectation(false)}>
              Annuler
            </button>
          </div>
        </form>
      )}

      <h2 style={{ fontSize: 'var(--batione-font-size-lg)', margin: '0 0 var(--batione-space-3)' }}>Historique des affectations</h2>
      {equipement.affectations.length === 0 ? (
        <div className="bo-card bo-empty-state">
          <p>Aucune affectation enregistrée pour cet équipement.</p>
        </div>
      ) : (
        <div className="bo-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--batione-bg)', textAlign: 'left' }}>
                {['Projet', 'Début', 'Retour prévu', 'Retour réel'].map((titre) => (
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
              {equipement.affectations.map((a) => (
                <tr key={a.id} style={{ borderTop: '1px solid var(--batione-ink-100)' }}>
                  <td style={cellStyle}>
                    {a.project.code} · {a.project.nom}
                  </td>
                  <td style={cellStyle}>{formatDateMA(new Date(a.date_debut))}</td>
                  <td style={cellStyle}>{a.date_retour_prevu ? formatDateMA(new Date(a.date_retour_prevu)) : '—'}</td>
                  <td style={cellStyle}>{a.date_retour_reel ? formatDateMA(new Date(a.date_retour_reel)) : '—'}</td>
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
