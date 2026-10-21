'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Users2 } from 'lucide-react';
import { TypeClient, LIBELLE_TYPE_CLIENT } from '@batione/shared-types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface ClientLigne {
  id: string;
  nom: string;
  type: TypeClient;
  telephone: string | null;
  email: string | null;
  ville: string | null;
  ice: string | null;
}

interface ReponseListe {
  donnees: ClientLigne[];
  metadonnees: { total: number };
}

export default function PageClients() {
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [clients, setClients] = useState<ClientLigne[] | null>(null);
  const [recherche, setRecherche] = useState('');
  const [type, setType] = useState<TypeClient | ''>('');
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (recherche) params.set('recherche', recherche);
      if (type) params.set('type', type);
      const reponse = await api.get<ReponseListe>(`/clients?${params.toString()}`);
      setClients(reponse.donnees);
    } catch {
      setErreur('Impossible de charger les clients.');
    }
  }, [recherche, type]);

  useEffect(() => {
    if (!moi) return;
    charger();
  }, [moi, charger]);

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--batione-space-5)',
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--batione-font-size-xl)', margin: 0 }}>Clients</h1>
          <p style={{ color: 'var(--batione-ink-500)', margin: '4px 0 0' }}>
            Votre répertoire clients — particuliers, entreprises et entités publiques.
          </p>
        </div>
        <Link href="/clients/nouveau" className="bo-btn bo-btn--primary">
          <Plus size={18} aria-hidden />
          Nouveau client
        </Link>
      </div>

      <div className="bo-card" style={{ marginBottom: 'var(--batione-space-4)', display: 'flex', gap: 'var(--batione-space-3)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={16}
            color="var(--batione-ink-500)"
            aria-hidden
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            className="bo-input"
            placeholder="Rechercher par nom, téléphone, email ou ICE…"
            style={{ paddingLeft: 36 }}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <select className="bo-input" style={{ width: 220 }} value={type} onChange={(e) => setType(e.target.value as TypeClient | '')}>
          <option value="">Tous les types</option>
          {Object.values(TypeClient).map((t) => (
            <option key={t} value={t}>
              {LIBELLE_TYPE_CLIENT[t]}
            </option>
          ))}
        </select>
      </div>

      {erreur && <p className="bo-error-text">{erreur}</p>}

      {clients === null ? (
        <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>
      ) : clients.length === 0 ? (
        <div className="bo-card bo-empty-state">
          <Users2 size={40} color="var(--batione-ink-300)" style={{ marginBottom: 'var(--batione-space-3)' }} aria-hidden />
          <p style={{ fontSize: 'var(--batione-font-size-lg)', fontWeight: 600, color: 'var(--batione-ink-800)' }}>
            {recherche || type ? 'Aucun client ne correspond à votre recherche' : 'Ajoutez votre premier client'}
          </p>
          <p>Retrouvez ses coordonnées, projets et documents depuis une seule fiche.</p>
          <Link href="/clients/nouveau" className="bo-btn bo-btn--primary">
            Ajouter un client
          </Link>
        </div>
      ) : (
        <div className="bo-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--batione-bg)', textAlign: 'left' }}>
                {['Nom', 'Type', 'Téléphone', 'Email', 'Ville', 'ICE'].map((titre) => (
                  <th
                    key={titre}
                    style={{
                      padding: 'var(--batione-space-3) var(--batione-space-4)',
                      fontSize: 'var(--batione-font-size-xs)',
                      color: 'var(--batione-ink-500)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {titre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  style={{ borderTop: '1px solid var(--batione-ink-100)', cursor: 'pointer' }}
                >
                  <td style={{ ...cellStyle, fontWeight: 600 }}>{client.nom}</td>
                  <td style={cellStyle}>{LIBELLE_TYPE_CLIENT[client.type]}</td>
                  <td style={cellStyle}>{client.telephone ?? '—'}</td>
                  <td style={cellStyle}>{client.email ?? '—'}</td>
                  <td style={cellStyle}>{client.ville ?? '—'}</td>
                  <td style={cellStyle}>{client.ice ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  padding: 'var(--batione-space-3) var(--batione-space-4)',
  fontSize: 'var(--batione-font-size-sm)',
  color: 'var(--batione-ink-800)',
};
