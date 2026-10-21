'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TypeClient, LIBELLE_TYPE_CLIENT, ConditionsPaiement, LIBELLE_CONDITIONS_PAIEMENT } from '@batione/shared-types';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface FormulaireClient {
  nom: string;
  type: TypeClient;
  personneContact: string;
  telephone: string;
  email: string;
  ville: string;
  ice: string;
  conditionsPaiement: ConditionsPaiement;
}

const ETAT_INITIAL: FormulaireClient = {
  nom: '',
  type: TypeClient.ENTREPRISE,
  personneContact: '',
  telephone: '',
  email: '',
  ville: 'Casablanca',
  ice: '',
  conditionsPaiement: ConditionsPaiement.A_30_JOURS,
};

export default function PageNouveauClient() {
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [valeurs, setValeurs] = useState(ETAT_INITIAL);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  function majChamp<K extends keyof FormulaireClient>(champ: K, valeur: string) {
    setValeurs((v) => ({ ...v, [champ]: valeur }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const client = await api.post<{ id: string }>('/clients', {
        nom: valeurs.nom,
        type: valeurs.type,
        personneContact: valeurs.personneContact || undefined,
        telephone: valeurs.telephone || undefined,
        email: valeurs.email || undefined,
        ville: valeurs.ville || undefined,
        ice: valeurs.ice || undefined,
        conditionsPaiement: valeurs.conditionsPaiement,
      });
      router.push(`/clients/${client.id}`);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Impossible de créer le client. Veuillez réessayer.');
    } finally {
      setChargement(false);
    }
  }

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;

  return (
    <div style={{ maxWidth: 640 }}>
      <Link
        href="/clients"
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
        Retour aux clients
      </Link>

      <h1 style={{ fontSize: 'var(--batione-font-size-xl)', marginBottom: 'var(--batione-space-5)' }}>Nouveau client</h1>

      <form onSubmit={soumettre} className="bo-card">
        <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
          <div className="bo-field" style={{ flex: 2 }}>
            <label className="bo-label" htmlFor="nom">
              Nom / Raison sociale
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
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="type">
              Type
            </label>
            <select id="type" className="bo-input" value={valeurs.type} onChange={(e) => majChamp('type', e.target.value)}>
              {Object.values(TypeClient).map((t) => (
                <option key={t} value={t}>
                  {LIBELLE_TYPE_CLIENT[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="personneContact">
              Personne de contact
            </label>
            <input
              id="personneContact"
              className="bo-input"
              value={valeurs.personneContact}
              onChange={(e) => majChamp('personneContact', e.target.value)}
            />
          </div>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="telephone">
              Téléphone
            </label>
            <input
              id="telephone"
              className="bo-input"
              placeholder="+212 6XX XXX XXX"
              value={valeurs.telephone}
              onChange={(e) => majChamp('telephone', e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="email">
              Email
            </label>
            <input id="email" className="bo-input" type="email" value={valeurs.email} onChange={(e) => majChamp('email', e.target.value)} />
          </div>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="ville">
              Ville
            </label>
            <input id="ville" className="bo-input" value={valeurs.ville} onChange={(e) => majChamp('ville', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="ice">
              ICE <span style={{ fontWeight: 400, color: 'var(--batione-ink-500)' }}>(optionnel)</span>
            </label>
            <input id="ice" className="bo-input" value={valeurs.ice} onChange={(e) => majChamp('ice', e.target.value)} />
          </div>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="conditionsPaiement">
              Conditions de paiement
            </label>
            <select
              id="conditionsPaiement"
              className="bo-input"
              value={valeurs.conditionsPaiement}
              onChange={(e) => majChamp('conditionsPaiement', e.target.value)}
            >
              {Object.values(ConditionsPaiement).map((c) => (
                <option key={c} value={c}>
                  {LIBELLE_CONDITIONS_PAIEMENT[c]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {erreur && <p className="bo-error-text">{erreur}</p>}

        <div style={{ display: 'flex', gap: 'var(--batione-space-3)', marginTop: 'var(--batione-space-2)' }}>
          <button type="submit" className="bo-btn bo-btn--primary" disabled={chargement}>
            {chargement ? 'Création…' : 'Créer le client'}
          </button>
          <Link href="/clients" className="bo-btn bo-btn--secondary">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
