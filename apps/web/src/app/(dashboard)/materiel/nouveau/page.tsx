'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface FormulaireEquipement {
  nom: string;
  categorie: string;
  coutHoraireInterne: string;
  notes: string;
}

const ETAT_INITIAL: FormulaireEquipement = {
  nom: '',
  categorie: '',
  coutHoraireInterne: '',
  notes: '',
};

export default function PageNouvelEquipement() {
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [valeurs, setValeurs] = useState(ETAT_INITIAL);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  function majChamp<K extends keyof FormulaireEquipement>(champ: K, valeur: string) {
    setValeurs((v) => ({ ...v, [champ]: valeur }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const equipement = await api.post<{ id: string }>('/equipement', {
        nom: valeurs.nom,
        categorie: valeurs.categorie || undefined,
        coutHoraireInterne: valeurs.coutHoraireInterne ? Number(valeurs.coutHoraireInterne) : undefined,
        notes: valeurs.notes || undefined,
      });
      router.push(`/materiel/${equipement.id}`);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Impossible de créer cet équipement. Veuillez réessayer.');
    } finally {
      setChargement(false);
    }
  }

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;

  return (
    <div style={{ maxWidth: 640 }}>
      <Link
        href="/materiel"
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
        Retour au matériel
      </Link>

      <h1 style={{ fontSize: 'var(--batione-font-size-xl)', marginBottom: 'var(--batione-space-5)' }}>Nouvel équipement</h1>

      <form onSubmit={soumettre} className="bo-card">
        <div className="bo-field">
          <label className="bo-label" htmlFor="nom">
            Nom
          </label>
          <input
            id="nom"
            className="bo-input"
            required
            minLength={2}
            value={valeurs.nom}
            onChange={(e) => majChamp('nom', e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="categorie">
              Catégorie
            </label>
            <input
              id="categorie"
              className="bo-input"
              value={valeurs.categorie}
              onChange={(e) => majChamp('categorie', e.target.value)}
            />
          </div>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="coutHoraireInterne">
              Coût horaire interne (MAD/h)
            </label>
            <input
              id="coutHoraireInterne"
              className="bo-input"
              type="number"
              min={0}
              step="0.01"
              placeholder="0,00"
              value={valeurs.coutHoraireInterne}
              onChange={(e) => majChamp('coutHoraireInterne', e.target.value)}
            />
          </div>
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
            {chargement ? 'Création…' : 'Créer l’équipement'}
          </button>
          <Link href="/materiel" className="bo-btn bo-btn--secondary">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
