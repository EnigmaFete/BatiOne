'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Building2, CreditCard, FileText, FolderKanban } from 'lucide-react';
import { StatutOperationnel, LIBELLE_MODE_PAIEMENT, type ModePaiement } from '@batione/shared-types';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { formatMAD, formatDateMA } from '@/lib/format';
import { StatutOperationnelBadge } from '@/components/StatutOperationnelBadge';

interface DepenseDetail {
  id: string;
  date_depense: string;
  montant_ht: string;
  fournisseur: string | null;
  mode_paiement: ModePaiement | null;
  reference_piece: string | null;
  notes: string | null;
  statut: StatutOperationnel;
  motif_rejet: string | null;
  motif_extourne: string | null;
  extourne_de_id: string | null;
  categorie: { id: string; nom: string };
  project: { id: string; code: string; nom: string } | null;
  extourne: { id: string; statut: StatutOperationnel } | null;
}

type ActionMotif = 'rejeter' | 'extourner' | null;

export default function PageDetailDepense() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [depense, setDepense] = useState<DepenseDetail | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [actionMotif, setActionMotif] = useState<ActionMotif>(null);
  const [motifTexte, setMotifTexte] = useState('');

  const charger = useCallback(() => {
    api
      .get<DepenseDetail>(`/depenses/${id}`)
      .then(setDepense)
      .catch((err) => {
        if (err instanceof ApiError && err.code === 'RESSOURCE_INTROUVABLE') {
          setErreur('Cette dépense est introuvable.');
        } else {
          setErreur('Impossible de charger cette dépense.');
        }
      });
  }, [id]);

  useEffect(() => {
    if (!moi) return;
    charger();
  }, [moi, charger]);

  async function executerAction(action: string, payload?: { motif: string }) {
    setActionEnCours(action);
    setErreur(null);
    try {
      await api.post(`/depenses/${id}/${action}`, payload);
      setActionMotif(null);
      setMotifTexte('');
      charger();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Impossible d'effectuer cette action.");
    } finally {
      setActionEnCours(null);
    }
  }

  function confirmerMotif() {
    if (!actionMotif || motifTexte.trim().length < 5) return;
    executerAction(actionMotif, { motif: motifTexte.trim() });
  }

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;

  if (erreur && !depense) {
    return (
      <div>
        <p className="bo-error-text">{erreur}</p>
        <Link href="/finance" className="bo-btn bo-btn--secondary">
          Retour aux dépenses
        </Link>
      </div>
    );
  }

  if (!depense) {
    return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <button
        type="button"
        onClick={() => router.push('/finance')}
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
        Retour aux dépenses
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--batione-space-5)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-3)' }}>
            <h1 style={{ fontSize: 'var(--batione-font-size-xl)', margin: 0 }}>{formatMAD(depense.montant_ht)}</h1>
            <StatutOperationnelBadge statut={depense.statut} />
          </div>
          <p style={{ color: 'var(--batione-ink-500)', margin: '4px 0 0' }}>
            {depense.categorie.nom} · {formatDateMA(new Date(depense.date_depense))}
          </p>
        </div>
      </div>

      {depense.extourne_de_id && (
        <div className="bo-card" style={{ marginBottom: 'var(--batione-space-4)', background: 'var(--batione-danger-soft)' }}>
          <p style={{ margin: 0, fontSize: 'var(--batione-font-size-sm)' }}>
            Cet enregistrement est une <strong>extourne</strong> de la dépense{' '}
            <Link href={`/finance/${depense.extourne_de_id}`} style={{ color: 'var(--batione-danger)', fontWeight: 600 }}>
              originale
            </Link>
            {depense.motif_extourne ? ` — motif : ${depense.motif_extourne}` : ''}.
          </p>
        </div>
      )}

      {depense.extourne && (
        <div className="bo-card" style={{ marginBottom: 'var(--batione-space-4)', background: 'var(--batione-warning-soft)' }}>
          <p style={{ margin: 0, fontSize: 'var(--batione-font-size-sm)' }}>
            Cette dépense a été{' '}
            <Link href={`/finance/${depense.extourne.id}`} style={{ color: 'var(--batione-warning)', fontWeight: 600 }}>
              extournée
            </Link>
            .
          </p>
        </div>
      )}

      {depense.motif_rejet && depense.statut === StatutOperationnel.BROUILLON && (
        <div className="bo-card" style={{ marginBottom: 'var(--batione-space-4)', background: 'var(--batione-warning-soft)' }}>
          <p style={{ margin: 0, fontSize: 'var(--batione-font-size-sm)' }}>
            <strong>Rejetée</strong> — motif : {depense.motif_rejet}
          </p>
        </div>
      )}

      <div className="bo-card" style={{ marginBottom: 'var(--batione-space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--batione-space-4)' }}>
          <InfoLigne icon={Building2} libelle="Fournisseur" valeur={depense.fournisseur ?? 'Non renseigné'} />
          <InfoLigne
            icon={CreditCard}
            libelle="Mode de paiement"
            valeur={depense.mode_paiement ? LIBELLE_MODE_PAIEMENT[depense.mode_paiement] : 'Non précisé'}
          />
          <InfoLigne icon={FileText} libelle="Référence pièce" valeur={depense.reference_piece ?? 'Aucune'} />
          <InfoLigne
            icon={FolderKanban}
            libelle="Projet"
            valeur={depense.project ? `${depense.project.code} · ${depense.project.nom}` : 'Aucun'}
          />
        </div>
        {depense.notes && (
          <div style={{ marginTop: 'var(--batione-space-4)', paddingTop: 'var(--batione-space-4)', borderTop: '1px solid var(--batione-ink-100)' }}>
            <p style={{ fontSize: 'var(--batione-font-size-xs)', color: 'var(--batione-ink-500)', margin: '0 0 4px' }}>Notes</p>
            <p style={{ margin: 0 }}>{depense.notes}</p>
          </div>
        )}
      </div>

      {erreur && <p className="bo-error-text">{erreur}</p>}

      {actionMotif && (
        <div className="bo-card" style={{ marginBottom: 'var(--batione-space-4)' }}>
          <label className="bo-label" htmlFor="motif">
            Motif {actionMotif === 'rejeter' ? 'du rejet' : "de l'extourne"} (obligatoire)
          </label>
          <textarea
            id="motif"
            className="bo-input"
            rows={2}
            style={{ paddingTop: 10, paddingBottom: 10, height: 'auto', resize: 'vertical' }}
            value={motifTexte}
            onChange={(e) => setMotifTexte(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 'var(--batione-space-3)', marginTop: 'var(--batione-space-3)' }}>
            <button
              type="button"
              className="bo-btn bo-btn--primary"
              disabled={motifTexte.trim().length < 5 || actionEnCours !== null}
              onClick={confirmerMotif}
            >
              Confirmer
            </button>
            <button
              type="button"
              className="bo-btn bo-btn--secondary"
              onClick={() => {
                setActionMotif(null);
                setMotifTexte('');
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {!actionMotif && (
        <div style={{ display: 'flex', gap: 'var(--batione-space-3)' }}>
          {depense.statut === StatutOperationnel.BROUILLON && (
            <button
              type="button"
              className="bo-btn bo-btn--primary"
              disabled={actionEnCours !== null}
              onClick={() => executerAction('soumettre')}
            >
              {actionEnCours === 'soumettre' ? 'Soumission…' : 'Soumettre pour approbation'}
            </button>
          )}
          {depense.statut === StatutOperationnel.SOUMIS && (
            <>
              <button
                type="button"
                className="bo-btn bo-btn--primary"
                disabled={actionEnCours !== null}
                onClick={() => executerAction('approuver')}
              >
                {actionEnCours === 'approuver' ? 'Approbation…' : 'Approuver'}
              </button>
              <button
                type="button"
                className="bo-btn bo-btn--secondary"
                disabled={actionEnCours !== null}
                onClick={() => setActionMotif('rejeter')}
              >
                Rejeter
              </button>
            </>
          )}
          {depense.statut === StatutOperationnel.APPROUVE && (
            <button
              type="button"
              className="bo-btn bo-btn--primary"
              disabled={actionEnCours !== null}
              onClick={() => executerAction('enregistrer')}
            >
              {actionEnCours === 'enregistrer' ? 'Enregistrement…' : 'Enregistrer (sceller définitivement)'}
            </button>
          )}
          {depense.statut === StatutOperationnel.ENREGISTRE && !depense.extourne && (
            <button
              type="button"
              className="bo-btn bo-btn--secondary"
              style={{ color: 'var(--batione-danger)', borderColor: 'var(--batione-danger)' }}
              disabled={actionEnCours !== null}
              onClick={() => setActionMotif('extourner')}
            >
              Extourner
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InfoLigne({ icon: Icon, libelle, valeur }: { icon: typeof Calendar; libelle: string; valeur: string }) {
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
