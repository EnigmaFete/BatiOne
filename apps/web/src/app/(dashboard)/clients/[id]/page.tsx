'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, MapPin, CreditCard, FolderKanban } from 'lucide-react';
import { TypeClient, LIBELLE_TYPE_CLIENT, ConditionsPaiement, LIBELLE_CONDITIONS_PAIEMENT } from '@batione/shared-types';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { formatMAD } from '@/lib/format';

interface ClientDetail {
  id: string;
  nom: string;
  type: TypeClient;
  personne_contact: string | null;
  telephone: string | null;
  whatsapp: string | null;
  email: string | null;
  adresse: string | null;
  ville: string | null;
  region: string | null;
  ice: string | null;
  if_num: string | null;
  rc: string | null;
  cnss: string | null;
  conditions_paiement: ConditionsPaiement;
  limite_credit: string;
  notes: string | null;
  projects: { id: string; code: string; nom: string; statut: string }[];
}

export default function PageDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!moi) return;
    api
      .get<ClientDetail>(`/clients/${id}`)
      .then(setClient)
      .catch((err) => {
        if (err instanceof ApiError && err.code === 'RESSOURCE_INTROUVABLE') {
          setErreur('Ce client est introuvable.');
        } else {
          setErreur('Impossible de charger ce client.');
        }
      });
  }, [moi, id]);

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;

  if (erreur) {
    return (
      <div>
        <p className="bo-error-text">{erreur}</p>
        <Link href="/clients" className="bo-btn bo-btn--secondary">
          Retour aux clients
        </Link>
      </div>
    );
  }

  if (!client) {
    return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push('/clients')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--batione-space-2)',
          color: 'var(--batione-ink-500)',
          fontSize: 'var(--batione-font-size-sm)',
          marginBottom: 'var(--batione-space-4)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <ArrowLeft size={16} aria-hidden />
        Retour aux clients
      </button>

      <div style={{ marginBottom: 'var(--batione-space-5)' }}>
        <h1 style={{ fontSize: 'var(--batione-font-size-xl)', margin: 0 }}>{client.nom}</h1>
        <p style={{ color: 'var(--batione-ink-500)', margin: '4px 0 0' }}>
          {LIBELLE_TYPE_CLIENT[client.type]}
          {client.ville ? ` · ${client.ville}` : ''}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
        <div className="bo-card" style={{ flex: 2 }}>
          <h2 style={{ fontSize: 'var(--batione-font-size-lg)', marginTop: 0 }}>Coordonnées</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--batione-space-4)' }}>
            <InfoLigne icon={Phone} libelle="Téléphone" valeur={client.telephone ?? 'Non renseigné'} />
            <InfoLigne icon={Mail} libelle="Email" valeur={client.email ?? 'Non renseigné'} />
            <InfoLigne icon={MapPin} libelle="Adresse" valeur={client.adresse ?? client.ville ?? 'Non renseignée'} />
            <InfoLigne
              icon={CreditCard}
              libelle="Conditions de paiement"
              valeur={LIBELLE_CONDITIONS_PAIEMENT[client.conditions_paiement]}
            />
          </div>

          {(client.ice || client.if_num || client.rc) && (
            <div
              style={{
                marginTop: 'var(--batione-space-5)',
                paddingTop: 'var(--batione-space-4)',
                borderTop: '1px solid var(--batione-ink-100)',
                display: 'flex',
                gap: 'var(--batione-space-5)',
                fontSize: 'var(--batione-font-size-sm)',
              }}
            >
              {client.ice && (
                <span>
                  <strong>ICE :</strong> {client.ice}
                </span>
              )}
              {client.if_num && (
                <span>
                  <strong>IF :</strong> {client.if_num}
                </span>
              )}
              {client.rc && (
                <span>
                  <strong>RC :</strong> {client.rc}
                </span>
              )}
            </div>
          )}

          {client.notes && (
            <div style={{ marginTop: 'var(--batione-space-4)' }}>
              <p style={{ fontSize: 'var(--batione-font-size-xs)', color: 'var(--batione-ink-500)', margin: '0 0 4px' }}>
                Notes
              </p>
              <p style={{ margin: 0 }}>{client.notes}</p>
            </div>
          )}
        </div>

        <div className="bo-card" style={{ flex: 1 }}>
          <h2 style={{ fontSize: 'var(--batione-font-size-lg)', marginTop: 0 }}>
            Solde & limite de crédit
          </h2>
          <p style={{ color: 'var(--batione-ink-500)', fontSize: 'var(--batione-font-size-sm)', marginBottom: 4 }}>
            Solde dû
          </p>
          <p style={{ fontSize: 'var(--batione-font-size-xl)', fontWeight: 700, margin: '0 0 16px' }}>{formatMAD(0)}</p>
          <p style={{ color: 'var(--batione-ink-500)', fontSize: 'var(--batione-font-size-sm)' }}>
            Arrivera avec le module Finance.
          </p>
        </div>
      </div>

      <div className="bo-card" style={{ marginTop: 'var(--batione-space-4)' }}>
        <h2 style={{ fontSize: 'var(--batione-font-size-lg)', marginTop: 0, display: 'flex', alignItems: 'center', gap: 'var(--batione-space-2)' }}>
          <FolderKanban size={18} aria-hidden />
          Projets ({client.projects.length})
        </h2>
        {client.projects.length === 0 ? (
          <p style={{ color: 'var(--batione-ink-500)' }}>Aucun projet pour ce client pour le moment.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {client.projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projets/${p.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 'var(--batione-space-3) 0',
                    borderBottom: '1px solid var(--batione-ink-100)',
                    color: 'var(--batione-ink-800)',
                  }}
                >
                  <span>
                    {p.code} · {p.nom}
                  </span>
                  <span style={{ color: 'var(--batione-ink-500)' }}>{p.statut}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function InfoLigne({ icon: Icon, libelle, valeur }: { icon: typeof Phone; libelle: string; valeur: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--batione-space-3)' }}>
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--batione-radius-md)',
          background: 'var(--batione-bg)',
          color: 'var(--batione-ink-500)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} aria-hidden />
      </span>
      <div>
        <p style={{ margin: 0, fontSize: 'var(--batione-font-size-xs)', color: 'var(--batione-ink-500)' }}>{libelle}</p>
        <p style={{ margin: 0, fontWeight: 600 }}>{valeur}</p>
      </div>
    </div>
  );
}
