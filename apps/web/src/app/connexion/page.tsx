'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { api, ApiError, definirJetonAcces } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { AuthBackground } from '@/components/AuthBackground';

export default function PageConnexion() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
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
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--batione-space-5)',
      }}
    >
      <AuthBackground />

      <div
        className="bo-card"
        style={{ position: 'relative', zIndex: 1, width: 440, padding: 'var(--batione-space-8) var(--batione-space-6)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--batione-space-5)' }}>
          <Logo />
        </div>

        <p
          style={{
            color: 'var(--batione-ink-500)',
            textAlign: 'center',
            marginTop: 0,
            marginBottom: 'var(--batione-space-6)',
            lineHeight: 1.5,
          }}
        >
          Gérez vos projets, votre argent et vos équipes en un seul endroit.
        </p>

        <form onSubmit={soumettre}>
          <div className="bo-field">
            <label className="bo-label" htmlFor="email">
              Email professionnel
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                color="var(--batione-ink-500)"
                aria-hidden
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="email"
                className="bo-input"
                type="email"
                autoComplete="email"
                placeholder="votre@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <div className="bo-field">
            <label className="bo-label" htmlFor="motDePasse">
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="var(--batione-ink-500)"
                aria-hidden
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="motDePasse"
                className="bo-input"
                type={motDePasseVisible ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Votre mot de passe"
                required
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                style={{ paddingLeft: 40, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setMotDePasseVisible((v) => !v)}
                aria-label={motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--batione-ink-500)',
                  display: 'flex',
                }}
              >
                {motDePasseVisible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
              </button>
            </div>
          </div>

          {erreur && <p className="bo-error-text">{erreur}</p>}

          <button
            type="submit"
            className="bo-btn bo-btn--primary"
            style={{ width: '100%', gap: 'var(--batione-space-2)', marginTop: 'var(--batione-space-2)' }}
            disabled={chargement}
          >
            {chargement ? 'Connexion…' : 'Se connecter'}
            {!chargement && <ArrowRight size={18} aria-hidden />}
          </button>
        </form>

        <hr style={{ border: 'none', borderTop: '1px solid var(--batione-ink-100)', margin: 'var(--batione-space-6) 0 var(--batione-space-4)' }} />

        <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--batione-font-size-sm)' }}>
          Nouvelle entreprise ?{' '}
          <Link href="/inscription" style={{ color: 'var(--batione-primary)', fontWeight: 600 }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
