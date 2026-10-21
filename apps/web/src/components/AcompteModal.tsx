'use client';

import { useState } from 'react';
import { X, DollarSign, Save, AlertCircle } from 'lucide-react';
import { ModePaiement, LIBELLE_MODE_PAIEMENT } from '@batione/shared-types';
import { api } from '@/lib/api';

interface WorkerOption {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  poste: string;
}

interface ProjectOption {
  id: string;
  code: string;
  nom: string;
}

interface AcompteModalProps {
  ouvert: boolean;
  workers: WorkerOption[];
  projects: ProjectOption[];
  workerIdPreselectionne?: string;
  onFermer: () => void;
  onSucces: () => void;
}

export function AcompteModal({
  ouvert,
  workers,
  projects,
  workerIdPreselectionne,
  onFermer,
  onSucces,
}: AcompteModalProps) {
  const [workerId, setWorkerId] = useState(workerIdPreselectionne ?? (workers[0]?.id || ''));
  const [projectId, setProjectId] = useState('');
  const [dateAcompte, setDateAcompte] = useState(new Date().toISOString().split('T')[0]);
  const [montant, setMontant] = useState('200');
  const [modePaiement, setModePaiement] = useState<ModePaiement>(ModePaiement.ESPECES);
  const [motif, setMotif] = useState('Avance quinzaine');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!ouvert) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    try {
      await api.post('/acomptes', {
        worker_id: workerId,
        project_id: projectId || undefined,
        date_acompte: dateAcompte,
        montant_mad: Number(montant),
        mode_paiement: modePaiement,
        motif: motif.trim() || undefined,
      });

      onSucces();
      onFermer();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErreur(err.message);
      } else {
        setErreur('Une erreur est survenue lors de l’enregistrement de l’acompte.');
      }
    } finally {
      setChargement(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: 'var(--batione-space-4)',
      }}
    >
      <div
        className="bo-card"
        style={{
          width: '100%',
          maxWidth: 520,
          padding: 'var(--batione-space-6)',
          borderRadius: 'var(--batione-radius-lg)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--batione-space-4)',
            borderBottom: '1px solid var(--batione-ink-100)',
            paddingBottom: 'var(--batione-space-3)',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 'var(--batione-font-size-lg)',
                color: 'var(--batione-ink-900)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--batione-space-2)',
              }}
            >
              <DollarSign size={20} color="var(--batione-primary)" />
              Remise d’un Acompte sur Salaire
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--batione-ink-500)', fontSize: 'var(--batione-font-size-xs)' }}>
              Avance chantier en MAD, déduite automatiquement lors du calcul de paie.
            </p>
          </div>
          <button
            type="button"
            onClick={onFermer}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--batione-ink-500)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {erreur && (
          <div
            style={{
              backgroundColor: 'var(--batione-danger-soft)',
              color: 'var(--batione-danger)',
              padding: 'var(--batione-space-3)',
              borderRadius: 'var(--batione-radius-md)',
              marginBottom: 'var(--batione-space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--batione-space-2)',
              fontSize: 'var(--batione-font-size-sm)',
            }}
          >
            <AlertCircle size={16} />
            {erreur}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--batione-space-3)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
              Collaborateur / Ouvrier <span style={{ color: 'var(--batione-danger)' }}>*</span>
            </label>
            <select
              className="bo-input"
              required
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
            >
              <option value="">Sélectionner un collaborateur...</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.matricule} — {w.nom} {w.prenom} ({w.poste})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--batione-space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                Montant versé (MAD) <span style={{ color: 'var(--batione-danger)' }}>*</span>
              </label>
              <input
                type="number"
                min="10"
                step="10"
                required
                className="bo-input"
                placeholder="ex. 300"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                Date de remise <span style={{ color: 'var(--batione-danger)' }}>*</span>
              </label>
              <input
                type="date"
                required
                className="bo-input"
                value={dateAcompte}
                onChange={(e) => setDateAcompte(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--batione-space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                Mode de règlement
              </label>
              <select
                className="bo-input"
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
              >
                {Object.values(ModePaiement).map((m) => (
                  <option key={m} value={m}>
                    {LIBELLE_MODE_PAIEMENT[m] || m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                Chantier rattaché (optionnel)
              </label>
              <select
                className="bo-input"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Aucun / Siège</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
              Motif de l’acompte
            </label>
            <input
              className="bo-input"
              placeholder="ex. Avance fête, transport, quinzaine..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--batione-space-3)',
              marginTop: 'var(--batione-space-4)',
              borderTop: '1px solid var(--batione-ink-100)',
              paddingTop: 'var(--batione-space-4)',
            }}
          >
            <button
              type="button"
              className="bo-btn bo-btn--secondary"
              onClick={onFermer}
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bo-btn bo-btn--primary"
              disabled={chargement}
            >
              <Save size={16} />
              {chargement ? 'Enregistrement…' : 'Enregistrer l’acompte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
