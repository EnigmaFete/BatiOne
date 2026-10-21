'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, definirJetonAcces } from '@/lib/api';
import { Logo } from '@/components/Logo';

interface FormulaireInscription {
  nomSociete: string;
  ice: string;
  ville: string;
  prenomAdmin: string;
  nomAdmin: string;
  emailAdmin: string;
  motDePasseAdmin: string;
}

const ETAT_INITIAL: FormulaireInscription = {
  nomSociete: '',
  ice: '',
  ville: 'Casablanca',
  prenomAdmin: '',
  nomAdmin: '',
  emailAdmin: '',
  motDePasseAdmin: '',
};

export default function PageInscription() {
  const router = useRouter();
  const [valeurs, setValeurs] = useState(ETAT_INITIAL);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  function majChamp<K extends keyof FormulaireInscription>(champ: K, valeur: string) {
    setValeurs((v) => ({ ...v, [champ]: valeur }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await api.post('/organisations/inscription', valeurs);
      const { accessToken } = await api.post<{ accessToken: string }>('/auth/connexion', {
        email: valeurs.emailAdmin,
        password: valeurs.motDePasseAdmin,
      });
      definirJetonAcces(accessToken);
      router.push('/tableau-de-bord');
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "L'inscription a échoué. Veuillez réessayer.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--batione-ink-900)',
        padding: 'var(--batione-space-5)',
      }}
    >
      <div className="bo-card" style={{ width: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--batione-space-4)' }}>
          <Logo size={64} />
        </div>
        <h1 style={{ fontSize: 'var(--batione-font-size-xl)', marginBottom: 4, textAlign: 'center' }}>Créer votre espace BatiOne</h1>
        <p style={{ color: 'var(--batione-ink-500)', marginTop: 0, marginBottom: 'var(--batione-space-5)', textAlign: 'center' }}>
          Quelques informations sur votre entreprise pour démarrer.
        </p>

        <form onSubmit={soumettre}>
          <div className="bo-field">
            <label className="bo-label" htmlFor="nomSociete">
              Raison sociale
            </label>
            <input
              id="nomSociete"
              className="bo-input"
              required
              value={valeurs.nomSociete}
              onChange={(e) => majChamp('nomSociete', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
            <div className="bo-field" style={{ flex: 1 }}>
              <label className="bo-label" htmlFor="ice">
                ICE
              </label>
              <input
                id="ice"
                className="bo-input"
                required
                value={valeurs.ice}
                onChange={(e) => majChamp('ice', e.target.value)}
              />
            </div>
            <div className="bo-field" style={{ flex: 1 }}>
              <label className="bo-label" htmlFor="ville">
                Ville
              </label>
              <input
                id="ville"
                className="bo-input"
                value={valeurs.ville}
                onChange={(e) => majChamp('ville', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
            <div className="bo-field" style={{ flex: 1 }}>
              <label className="bo-label" htmlFor="prenomAdmin">
                Votre prénom
              </label>
              <input
                id="prenomAdmin"
                className="bo-input"
                required
                value={valeurs.prenomAdmin}
                onChange={(e) => majChamp('prenomAdmin', e.target.value)}
              />
            </div>
            <div className="bo-field" style={{ flex: 1 }}>
              <label className="bo-label" htmlFor="nomAdmin">
                Votre nom
              </label>
              <input
                id="nomAdmin"
                className="bo-input"
                required
                value={valeurs.nomAdmin}
                onChange={(e) => majChamp('nomAdmin', e.target.value)}
              />
            </div>
          </div>

          <div className="bo-field">
            <label className="bo-label" htmlFor="emailAdmin">
              Email professionnel
            </label>
            <input
              id="emailAdmin"
              className="bo-input"
              type="email"
              required
              value={valeurs.emailAdmin}
              onChange={(e) => majChamp('emailAdmin', e.target.value)}
            />
          </div>

          <div className="bo-field">
            <label className="bo-label" htmlFor="motDePasseAdmin">
              Mot de passe
            </label>
            <input
              id="motDePasseAdmin"
              className="bo-input"
              type="password"
              required
              minLength={8}
              value={valeurs.motDePasseAdmin}
              onChange={(e) => majChamp('motDePasseAdmin', e.target.value)}
            />
          </div>

          {erreur && <p className="bo-error-text">{erreur}</p>}

          <button type="submit" className="bo-btn bo-btn--primary" style={{ width: '100%' }} disabled={chargement}>
            {chargement ? 'Création…' : 'Créer mon espace'}
          </button>
        </form>

        <p style={{ marginTop: 'var(--batione-space-5)', fontSize: 'var(--batione-font-size-sm)' }}>
          Déjà un compte ?{' '}
          <Link href="/connexion" style={{ color: 'var(--batione-primary)', fontWeight: 600 }}>
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
