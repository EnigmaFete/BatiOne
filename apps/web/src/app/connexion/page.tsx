'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, definirJetonAcces } from '@/lib/api';

export default function PageConnexion() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const { accessToken } = await api.post<{ accessToken: string }>('/auth/connexion', {
        email,
        password: motDePasse,
      });
      definirJetonAcces(accessToken);
      router.push('/tableau-de-bord');
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Connexion impossible. Veuillez réessayer.');
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
      }}
    >
      <div className="bo-card" style={{ width: 400 }}>
        <h1 style={{ fontSize: 'var(--batione-font-size-xl)', marginBottom: 4 }}>BatiOne</h1>
        <p style={{ color: 'var(--batione-ink-500)', marginTop: 0, marginBottom: 'var(--batione-space-5)' }}>
          Gérez vos projets, votre argent et vos équipes en un seul endroit.
        </p>

        <form onSubmit={soumettre}>
          <div className="bo-field">
            <label className="bo-label" htmlFor="email">
              Email professionnel
            </label>
            <input
              id="email"
              className="bo-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="bo-field">
            <label className="bo-label" htmlFor="motDePasse">
              Mot de passe
            </label>
            <input
              id="motDePasse"
              className="bo-input"
              type="password"
              autoComplete="current-password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
          </div>

          {erreur && <p className="bo-error-text">{erreur}</p>}

          <button type="submit" className="bo-btn bo-btn--primary" style={{ width: '100%' }} disabled={chargement}>
            {chargement ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p style={{ marginTop: 'var(--batione-space-5)', fontSize: 'var(--batione-font-size-sm)' }}>
          Nouvelle entreprise ?{' '}
          <Link href="/inscription" style={{ color: 'var(--batione-primary)', fontWeight: 600 }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
