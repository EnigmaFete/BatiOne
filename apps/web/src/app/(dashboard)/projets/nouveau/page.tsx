'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TypeProjet, LIBELLE_TYPE_PROJET } from '@batione/shared-types';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface ClientOption {
  id: string;
  nom: string;
}

interface FormulaireProjet {
  nom: string;
  type: TypeProjet;
  clientId: string;
  budget: string;
  dateDebut: string;
  dateFinPrevue: string;
  description: string;
}

const ETAT_INITIAL: FormulaireProjet = {
  nom: '',
  type: TypeProjet.CONSTRUCTION,
  clientId: '',
  budget: '',
  dateDebut: '',
  dateFinPrevue: '',
  description: '',
};

export default function PageNouveauProjet() {
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [valeurs, setValeurs] = useState(ETAT_INITIAL);
  const [clients, setClients] = useState<ClientOption[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (!moi) return;
    api
      .get<ClientOption[]>('/clients/selection')
      .then(setClients)
      .catch(() => setClients([]));
  }, [moi]);

  function majChamp<K extends keyof FormulaireProjet>(champ: K, valeur: string) {
    setValeurs((v) => ({ ...v, [champ]: valeur }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const projet = await api.post<{ id: string }>('/projets', {
        nom: valeurs.nom,
        type: valeurs.type,
        clientId: valeurs.clientId || undefined,
        budget: valeurs.budget ? Number(valeurs.budget) : undefined,
        dateDebut: valeurs.dateDebut || undefined,
        dateFinPrevue: valeurs.dateFinPrevue || undefined,
        description: valeurs.description || undefined,
      });
      router.push(`/projets/${projet.id}`);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Impossible de créer le projet. Veuillez réessayer.');
    } finally {
      setChargement(false);
    }
  }

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;

  return (
    <div style={{ maxWidth: 640 }}>
      <Link
        href="/projets"
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
        Retour aux projets
      </Link>

      <h1 style={{ fontSize: 'var(--batione-font-size-xl)', marginBottom: 'var(--batione-space-5)' }}>
        Nouveau projet
      </h1>

      <form onSubmit={soumettre} className="bo-card">
        <div className="bo-field">
          <label className="bo-label" htmlFor="nom">
            Nom du projet
          </label>
          <input
            id="nom"
            className="bo-input"
            required
            minLength={2}
            placeholder="Ex. Villa Anfa, Mariage Benjelloun, Rénovation bureaux Maarif…"
            value={valeurs.nom}
            onChange={(e) => majChamp('nom', e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="type">
              Type de projet
            </label>
            <select
              id="type"
              className="bo-input"
              value={valeurs.type}
              onChange={(e) => majChamp('type', e.target.value)}
            >
              {Object.values(TypeProjet).map((t) => (
                <option key={t} value={t}>
                  {LIBELLE_TYPE_PROJET[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="clientId">
              Client
            </label>
            <select id="clientId" className="bo-input" value={valeurs.clientId} onChange={(e) => majChamp('clientId', e.target.value)}>
              <option value="">Aucun client</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
            {clients?.length === 0 && (
              <p style={{ fontSize: 'var(--batione-font-size-xs)', color: 'var(--batione-ink-500)', marginTop: 4 }}>
                Aucun client enregistré —{' '}
                <Link href="/clients/nouveau" style={{ color: 'var(--batione-primary)', fontWeight: 600 }}>
                  en créer un
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="budget">
              Budget prévisionnel (MAD)
            </label>
            <input
              id="budget"
              className="bo-input"
              type="number"
              min={0}
              step="0.01"
              placeholder="0,00"
              value={valeurs.budget}
              onChange={(e) => majChamp('budget', e.target.value)}
            />
          </div>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="dateDebut">
              Date de début
            </label>
            <input
              id="dateDebut"
              className="bo-input"
              type="date"
              value={valeurs.dateDebut}
              onChange={(e) => majChamp('dateDebut', e.target.value)}
            />
          </div>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="dateFinPrevue">
              Fin prévue
            </label>
            <input
              id="dateFinPrevue"
              className="bo-input"
              type="date"
              value={valeurs.dateFinPrevue}
              onChange={(e) => majChamp('dateFinPrevue', e.target.value)}
            />
          </div>
        </div>

        <div className="bo-field">
          <label className="bo-label" htmlFor="description">
            Description <span style={{ fontWeight: 400, color: 'var(--batione-ink-500)' }}>(optionnel)</span>
          </label>
          <textarea
            id="description"
            className="bo-input"
            rows={3}
            style={{ paddingTop: 10, paddingBottom: 10, height: 'auto', resize: 'vertical' }}
            value={valeurs.description}
            onChange={(e) => majChamp('description', e.target.value)}
          />
        </div>

        {erreur && <p className="bo-error-text">{erreur}</p>}

        <div style={{ display: 'flex', gap: 'var(--batione-space-3)', marginTop: 'var(--batione-space-2)' }}>
          <button type="submit" className="bo-btn bo-btn--primary" disabled={chargement}>
            {chargement ? 'Création…' : 'Créer le projet'}
          </button>
          <Link href="/projets" className="bo-btn bo-btn--secondary">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
