'use client';

import { useEffect, useState } from 'react';
import { Settings, Lock } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface ProfilOrganisation {
  id: string;
  nom: string;
  ice: string;
  rc: string | null;
  if_num: string | null;
  patente: string | null;
  cnss_employeur: string | null;
  adresse: string | null;
  ville: string;
  telephone: string | null;
  email: string | null;
  rib: string | null;
  banque: string | null;
}

type FormulaireModifiable = Omit<ProfilOrganisation, 'id' | 'ice'>;

export default function PageParametres() {
  const { moi } = useAuth();
  const [profil, setProfil] = useState<ProfilOrganisation | null>(null);
  const [valeurs, setValeurs] = useState<FormulaireModifiable | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [acces, setAcces] = useState<'chargement' | 'autorise' | 'refuse'>('chargement');
  const [enregistrement, setEnregistrement] = useState<'repos' | 'en_cours' | 'succes'>('repos');

  useEffect(() => {
    if (!moi) return;
    api
      .get<ProfilOrganisation>('/organisation/profil')
      .then((p) => {
        setProfil(p);
        setValeurs({
          nom: p.nom,
          rc: p.rc,
          if_num: p.if_num,
          patente: p.patente,
          cnss_employeur: p.cnss_employeur,
          adresse: p.adresse,
          ville: p.ville,
          telephone: p.telephone,
          email: p.email,
          rib: p.rib,
          banque: p.banque,
        });
        setAcces('autorise');
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setAcces('refuse');
        } else {
          setErreur('Impossible de charger les paramètres de l’entreprise.');
        }
      });
  }, [moi]);

  function majChamp<K extends keyof FormulaireModifiable>(champ: K, valeur: string) {
    setValeurs((v) => (v ? { ...v, [champ]: valeur } : v));
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!valeurs) return;
    setEnregistrement('en_cours');
    setErreur(null);
    try {
      const miseAJour = await api.patch<ProfilOrganisation>('/organisation/profil', valeurs);
      setProfil(miseAJour);
      setEnregistrement('succes');
      setTimeout(() => setEnregistrement('repos'), 2000);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Impossible d’enregistrer les modifications.');
      setEnregistrement('repos');
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-3)', marginBottom: 4 }}>
        <Settings size={24} color="var(--batione-primary)" aria-hidden />
        <h1 style={{ fontSize: 'var(--batione-font-size-xl)', margin: 0 }}>Paramètres</h1>
      </div>
      <p style={{ color: 'var(--batione-ink-500)', margin: '0 0 var(--batione-space-5)' }}>
        Profil légal de votre entreprise, utilisé sur les documents générés.
      </p>

      {acces === 'chargement' && <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>}

      {acces === 'refuse' && (
        <div className="bo-card" style={{ textAlign: 'center', padding: 'var(--batione-space-8)' }}>
          <Lock size={32} color="var(--batione-ink-300)" style={{ marginBottom: 'var(--batione-space-3)' }} aria-hidden />
          <p style={{ fontWeight: 600, color: 'var(--batione-ink-800)' }}>Accès réservé</p>
          <p style={{ color: 'var(--batione-ink-500)' }}>
            Seuls les administrateurs et le service comptable peuvent consulter cette page.
          </p>
        </div>
      )}

      {acces === 'autorise' && profil && valeurs && (
        <form onSubmit={enregistrer} className="bo-card">
          <div className="bo-field">
            <label className="bo-label">ICE (non modifiable)</label>
            <input className="bo-input" value={profil.ice} disabled style={{ background: 'var(--batione-bg)' }} />
          </div>

          <div className="bo-field">
            <label className="bo-label" htmlFor="nom">
              Raison sociale
            </label>
            <input id="nom" className="bo-input" value={valeurs.nom} onChange={(e) => majChamp('nom', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
            <div className="bo-field" style={{ flex: 1 }}>
              <label className="bo-label" htmlFor="rc">
                RC
              </label>
              <input id="rc" className="bo-input" value={valeurs.rc ?? ''} onChange={(e) => majChamp('rc', e.target.value)} />
            </div>
            <div className="bo-field" style={{ flex: 1 }}>
              <label className="bo-label" htmlFor="if_num">
                IF
              </label>
              <input
                id="if_num"
                className="bo-input"
                value={valeurs.if_num ?? ''}
                onChange={(e) => majChamp('if_num', e.target.value)}
              />
            </div>
            <div className="bo-field" style={{ flex: 1 }}>
              <label className="bo-label" htmlFor="patente">
                Patente
              </label>
              <input
                id="patente"
                className="bo-input"
                value={valeurs.patente ?? ''}
                onChange={(e) => majChamp('patente', e.target.value)}
              />
            </div>
          </div>

          <div className="bo-field">
            <label className="bo-label" htmlFor="cnss_employeur">
              N° CNSS employeur
            </label>
            <input
              id="cnss_employeur"
              className="bo-input"
              value={valeurs.cnss_employeur ?? ''}
              onChange={(e) => majChamp('cnss_employeur', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
            <div className="bo-field" style={{ flex: 2 }}>
              <label className="bo-label" htmlFor="adresse">
                Adresse
              </label>
              <input
                id="adresse"
                className="bo-input"
                value={valeurs.adresse ?? ''}
                onChange={(e) => majChamp('adresse', e.target.value)}
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
              <label className="bo-label" htmlFor="telephone">
                Téléphone
              </label>
              <input
                id="telephone"
                className="bo-input"
                placeholder="+212 6XX XXX XXX"
                value={valeurs.telephone ?? ''}
                onChange={(e) => majChamp('telephone', e.target.value)}
              />
            </div>
            <div className="bo-field" style={{ flex: 1 }}>
              <label className="bo-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="bo-input"
                type="email"
                value={valeurs.email ?? ''}
                onChange={(e) => majChamp('email', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
            <div className="bo-field" style={{ flex: 1 }}>
              <label className="bo-label" htmlFor="banque">
                Banque
              </label>
              <input
                id="banque"
                className="bo-input"
                value={valeurs.banque ?? ''}
                onChange={(e) => majChamp('banque', e.target.value)}
              />
            </div>
            <div className="bo-field" style={{ flex: 1 }}>
              <label className="bo-label" htmlFor="rib">
                RIB
              </label>
              <input id="rib" className="bo-input" value={valeurs.rib ?? ''} onChange={(e) => majChamp('rib', e.target.value)} />
            </div>
          </div>

          {erreur && <p className="bo-error-text">{erreur}</p>}

          <button type="submit" className="bo-btn bo-btn--primary" disabled={enregistrement === 'en_cours'}>
            {enregistrement === 'en_cours' ? 'Enregistrement…' : enregistrement === 'succes' ? 'Enregistré ✓' : 'Enregistrer'}
          </button>
        </form>
      )}

      {erreur && acces !== 'autorise' && <p className="bo-error-text">{erreur}</p>}
    </div>
  );
}
