'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface FormulaireArticle {
  nom: string;
  categorie: string;
  unite: string;
  prixUnitaire: string;
  seuilAlerte: string;
}

const ETAT_INITIAL: FormulaireArticle = {
  nom: '',
  categorie: '',
  unite: 'u',
  prixUnitaire: '',
  seuilAlerte: '',
};

export default function PageNouvelArticle() {
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [valeurs, setValeurs] = useState(ETAT_INITIAL);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  function majChamp<K extends keyof FormulaireArticle>(champ: K, valeur: string) {
    setValeurs((v) => ({ ...v, [champ]: valeur }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const article = await api.post<{ id: string }>('/articles', {
        nom: valeurs.nom,
        categorie: valeurs.categorie || undefined,
        unite: valeurs.unite || undefined,
        prixUnitaire: valeurs.prixUnitaire ? Number(valeurs.prixUnitaire) : undefined,
        seuilAlerte: valeurs.seuilAlerte ? Number(valeurs.seuilAlerte) : undefined,
      });
      router.push(`/stock/${article.id}`);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Impossible de créer cet article. Veuillez réessayer.');
    } finally {
      setChargement(false);
    }
  }

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;

  return (
    <div style={{ maxWidth: 640 }}>
      <Link
        href="/stock"
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
        Retour au stock
      </Link>

      <h1 style={{ fontSize: 'var(--batione-font-size-xl)', marginBottom: 'var(--batione-space-5)' }}>Nouvel article</h1>

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
            <label className="bo-label" htmlFor="unite">
              Unité
            </label>
            <input id="unite" className="bo-input" value={valeurs.unite} onChange={(e) => majChamp('unite', e.target.value)} />
          </div>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="prixUnitaire">
              Prix unitaire (MAD)
            </label>
            <input
              id="prixUnitaire"
              className="bo-input"
              type="number"
              min={0}
              step="0.01"
              placeholder="0,00"
              value={valeurs.prixUnitaire}
              onChange={(e) => majChamp('prixUnitaire', e.target.value)}
            />
          </div>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="seuilAlerte">
              Seuil d’alerte
            </label>
            <input
              id="seuilAlerte"
              className="bo-input"
              type="number"
              min={0}
              step="0.001"
              placeholder="0"
              value={valeurs.seuilAlerte}
              onChange={(e) => majChamp('seuilAlerte', e.target.value)}
            />
          </div>
        </div>

        {erreur && <p className="bo-error-text">{erreur}</p>}

        <div style={{ display: 'flex', gap: 'var(--batione-space-3)', marginTop: 'var(--batione-space-2)' }}>
          <button type="submit" className="bo-btn bo-btn--primary" disabled={chargement}>
            {chargement ? 'Création…' : 'Créer l’article'}
          </button>
          <Link href="/stock" className="bo-btn bo-btn--secondary">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
