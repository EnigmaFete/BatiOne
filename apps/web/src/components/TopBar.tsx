'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Search, Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { api, definirJetonAcces } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export function TopBar() {
  const router = useRouter();
  const { moi } = useAuth();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fermerSiExterieur(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOuvert(false);
      }
    }
    document.addEventListener('mousedown', fermerSiExterieur);
    return () => document.removeEventListener('mousedown', fermerSiExterieur);
  }, []);

  async function seDeconnecter() {
    setDeconnexionEnCours(true);
    try {
      await api.post('/auth/deconnexion');
    } catch {
      // Même si l'appel échoue (session déjà expirée côté serveur, réseau coupé…), on efface le
      // jeton local et on redirige — l'utilisateur ne doit jamais rester bloqué sur un bouton
      // "Déconnexion" qui ne fait rien.
    } finally {
      definirJetonAcces(null);
      router.replace('/connexion');
    }
  }

  const initiale = moi ? moi.prenom.charAt(0).toUpperCase() : 'U';

  return (
    <header
      style={{
        height: 64,
        background: 'var(--batione-surface)',
        borderBottom: `1px solid var(--batione-ink-100)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--batione-space-5)',
        padding: '0 var(--batione-space-5)',
      }}
    >
      <button
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--batione-space-2)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--batione-ink-900)',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        <Building2 size={18} color="var(--batione-primary)" aria-hidden />
        {moi?.organization.nom ?? 'Mon entreprise'}
        <ChevronDown size={16} color="var(--batione-ink-500)" aria-hidden />
      </button>

      <div style={{ position: 'relative', flex: 1, maxWidth: 520 }}>
        <Search
          size={16}
          color="var(--batione-ink-500)"
          aria-hidden
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          className="bo-input"
          placeholder="Rechercher un projet, un client, un document…"
          style={{ paddingLeft: 36, background: 'var(--batione-bg)', border: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-4)', flexShrink: 0 }}>
        <span style={{ position: 'relative', display: 'inline-flex' }} aria-label="Notifications">
          <Bell size={20} color="var(--batione-ink-700)" aria-hidden />
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--batione-danger)',
              border: '1.5px solid var(--batione-surface)',
            }}
          />
        </span>

        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--batione-ink-700)',
            fontWeight: 600,
            fontSize: 'var(--batione-font-size-sm)',
          }}
        >
          FR
          <ChevronDown size={14} color="var(--batione-ink-500)" aria-hidden />
        </button>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setMenuOuvert((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOuvert}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--batione-primary-soft)',
                color: 'var(--batione-primary-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              {initiale}
            </span>
            <ChevronDown size={14} color="var(--batione-ink-500)" aria-hidden />
          </button>

          {menuOuvert && (
            <div
              role="menu"
              className="bo-card"
              style={{
                position: 'absolute',
                right: 0,
                top: 48,
                width: 220,
                padding: 'var(--batione-space-2)',
                zIndex: 20,
                boxShadow: 'var(--batione-shadow-md)',
              }}
            >
              <div style={{ padding: 'var(--batione-space-3)', borderBottom: '1px solid var(--batione-ink-100)' }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--batione-font-size-sm)' }}>
                  {moi ? `${moi.prenom} ${moi.nom}` : '…'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--batione-font-size-xs)', color: 'var(--batione-ink-500)' }}>
                  {moi?.role ?? ''}
                </p>
              </div>
              <button
                type="button"
                role="menuitem"
                disabled
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--batione-space-2)',
                  width: '100%',
                  padding: 'var(--batione-space-3)',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  color: 'var(--batione-ink-300)',
                  fontSize: 'var(--batione-font-size-sm)',
                  cursor: 'not-allowed',
                }}
              >
                <User size={16} aria-hidden />
                Mon profil
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={seDeconnecter}
                disabled={deconnexionEnCours}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--batione-space-2)',
                  width: '100%',
                  padding: 'var(--batione-space-3)',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  color: 'var(--batione-danger)',
                  fontSize: 'var(--batione-font-size-sm)',
                  fontWeight: 600,
                  cursor: deconnexionEnCours ? 'wait' : 'pointer',
                }}
              >
                <LogOut size={16} aria-hidden />
                {deconnexionEnCours ? 'Déconnexion…' : 'Déconnexion'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
