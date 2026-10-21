'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ModePaiement, LIBELLE_MODE_PAIEMENT } from '@batione/shared-types';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface CategorieOption {
  id: string;
  nom: string;
}

interface ProjetOption {
  id: string;
  code: string;
  nom: string;
}

interface FormulaireDepense {
  dateDepense: string;
  montantHt: string;
  categorieId: string;
  projectId: string;
  fournisseur: string;
  modePaiement: ModePaiement | '';
  referencePiece: string;
  notes: string;
}

function aujourdHui(): string {
  return new Date().toISOString().slice(0, 10);
}

const ETAT_INITIAL: FormulaireDepense = {
  dateDepense: aujourdHui(),
  montantHt: '',
  categorieId: '',
  projectId: '',
  fournisseur: '',
  modePaiement: '',
  referencePiece: '',
  notes: '',
};

export default function PageNouvelleDepense() {
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [valeurs, setValeurs] = useState(ETAT_INITIAL);
  const [categories, setCategories] = useState<CategorieOption[] | null>(null);
  const [projets, setProjets] = useState<ProjetOption[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (!moi) return;
    api
      .get<CategorieOption[]>('/categories-depenses')
      .then(setCategories)
      .catch(() => setCategories([]));
    api
      .get<{ donnees: ProjetOption[] }>('/projets')
      .then((r) => setProjets(r.donnees))
      .catch(() => setProjets([]));
  }, [moi]);

  function majChamp<K extends keyof FormulaireDepense>(champ: K, valeur: string) {
    setValeurs((v) => ({ ...v, [champ]: valeur }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const depense = await api.post<{ id: string }>('/depenses', {
        dateDepense: valeurs.dateDepense,
        montantHt: Number(valeurs.montantHt),
        categorieId: valeurs.categorieId,
        projectId: valeurs.projectId || undefined,
        fournisseur: valeurs.fournisseur || undefined,
        modePaiement: valeurs.modePaiement || undefined,
        referencePiece: valeurs.referencePiece || undefined,
        notes: valeurs.notes || undefined,
      });
      router.push(`/finance/${depense.id}`);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Impossible de créer la dépense. Veuillez réessayer.');
    } finally {
      setChargement(false);
    }
  }

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;

  return (
    <div style={{ maxWidth: 640 }}>
      <Link
        href="/finance"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--batione-space-2)',
          color: 'var(--batione-ink-500)',
          fontSize: 'var(--batione-font-size-sm)',
          marginBottom: 'var(--batione-space-4)',
        }}
      >
        <ArrowLeft size={16} aria-hidden />
        Retour aux dépenses
      </Link>

      <h1 style={{ fontSize: 'var(--batione-font-size-xl)', marginBottom: 'var(--batione-space-5)' }}>Nouvelle dépense</h1>

      <form onSubmit={soumettre} className="bo-card">
        <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="dateDepense">
              Date
            </label>
            <input
              id="dateDepense"
              className="bo-input"
              type="date"
              required
              value={valeurs.dateDepense}
              onChange={(e) => majChamp('dateDepense', e.target.value)}
            />
          </div>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="montantHt">
              Montant HT (MAD)
            </label>
            <input
              id="montantHt"
              className="bo-input"
              type="number"
              min={0.01}
              step="0.01"
              required
              placeholder="0,00"
              value={valeurs.montantHt}
              onChange={(e) => majChamp('montantHt', e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="categorieId">
              Catégorie
            </label>
            <select
              id="categorieId"
              className="bo-input"
              required
              value={valeurs.categorieId}
              onChange={(e) => majChamp('categorieId', e.target.value)}
            >
              <option value="" disabled>
                Choisir une catégorie
              </option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="projectId">
              Projet <span style={{ fontWeight: 400, color: 'var(--batione-ink-500)' }}>(optionnel)</span>
            </label>
            <select id="projectId" className="bo-input" value={valeurs.projectId} onChange={(e) => majChamp('projectId', e.target.value)}>
              <option value="">Aucun projet</option>
              {projets?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="fournisseur">
              Fournisseur
            </label>
            <input
              id="fournisseur"
              className="bo-input"
              value={valeurs.fournisseur}
              onChange={(e) => majChamp('fournisseur', e.target.value)}
            />
          </div>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="modePaiement">
              Mode de paiement
            </label>
            <select
              id="modePaiement"
              className="bo-input"
              value={valeurs.modePaiement}
              onChange={(e) => majChamp('modePaiement', e.target.value)}
            >
              <option value="">Non précisé</option>
              {Object.values(ModePaiement).map((m) => (
                <option key={m} value={m}>
                  {LIBELLE_MODE_PAIEMENT[m]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bo-field">
          <label className="bo-label" htmlFor="referencePiece">
            Référence pièce <span style={{ fontWeight: 400, color: 'var(--batione-ink-500)' }}>(n° facture, reçu…)</span>
          </label>
          <input
            id="referencePiece"
            className="bo-input"
            value={valeurs.referencePiece}
            onChange={(e) => majChamp('referencePiece', e.target.value)}
          />
        </div>

        <div className="bo-field">
          <label className="bo-label" htmlFor="notes">
            Notes <span style={{ fontWeight: 400, color: 'var(--batione-ink-500)' }}>(optionnel)</span>
          </label>
          <textarea
            id="notes"
            className="bo-input"
            rows={3}
            style={{ paddingTop: 10, paddingBottom: 10, height: 'auto', resize: 'vertical' }}
            value={valeurs.notes}
            onChange={(e) => majChamp('notes', e.target.value)}
          />
        </div>

        {erreur && <p className="bo-error-text">{erreur}</p>}

        <div style={{ display: 'flex', gap: 'var(--batione-space-3)', marginTop: 'var(--batione-space-2)' }}>
          <button type="submit" className="bo-btn bo-btn--primary" disabled={chargement}>
            {chargement ? 'Création…' : 'Créer la dépense (brouillon)'}
          </button>
          <Link href="/finance" className="bo-btn bo-btn--secondary">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
