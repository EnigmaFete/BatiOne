'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Landmark } from 'lucide-react';
import { StatutOperationnel, LIBELLE_STATUT_OPERATIONNEL } from '@batione/shared-types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { formatMAD, formatDateMA } from '@/lib/format';
import { StatutOperationnelBadge } from '@/components/StatutOperationnelBadge';

interface DepenseLigne {
  id: string;
  date_depense: string;
  montant_ht: string;
  fournisseur: string | null;
  statut: StatutOperationnel;
  categorie: { id: string; nom: string };
  project: { id: string; code: string; nom: string } | null;
}

interface ReponseListe {
  donnees: DepenseLigne[];
  metadonnees: { total: number };
}

export default function PageFinance() {
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [depenses, setDepenses] = useState<DepenseLigne[] | null>(null);
  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState<StatutOperationnel | ''>('');
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (recherche) params.set('recherche', recherche);
      if (statut) params.set('statut', statut);
      const reponse = await api.get<ReponseListe>(`/depenses?${params.toString()}`);
      setDepenses(reponse.donnees);
    } catch {
      setErreur('Impossible de charger les dépenses.');
    }
  }, [recherche, statut]);

  useEffect(() => {
    if (!moi) return;
    charger();
  }, [moi, charger]);

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;

  const total = depenses?.reduce((acc, d) => acc + Number(d.montant_ht), 0) ?? 0;

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
          <h1 style={{ fontSize: 'var(--batione-font-size-xl)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--batione-space-2)' }}>
            <Landmark size={22} color="var(--batione-primary)" aria-hidden />
            Finance — Dépenses
          </h1>
          <p style={{ color: 'var(--batione-ink-500)', margin: '4px 0 0' }}>
            Cycle d&apos;approbation : brouillon → soumis → approuvé → enregistré.
          </p>
        </div>
        <Link href="/finance/nouveau" className="bo-btn bo-btn--primary">
          <Plus size={18} aria-hidden />
          Nouvelle dépense
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
            placeholder="Rechercher par fournisseur ou référence…"
            style={{ paddingLeft: 36 }}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <select className="bo-input" style={{ width: 220 }} value={statut} onChange={(e) => setStatut(e.target.value as StatutOperationnel | '')}>
          <option value="">Tous les statuts</option>
          {Object.values(StatutOperationnel).map((s) => (
            <option key={s} value={s}>
              {LIBELLE_STATUT_OPERATIONNEL[s]}
            </option>
          ))}
        </select>
      </div>

      {erreur && <p className="bo-error-text">{erreur}</p>}

      {depenses === null ? (
        <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>
      ) : depenses.length === 0 ? (
        <div className="bo-card bo-empty-state">
          <Landmark size={40} color="var(--batione-ink-300)" style={{ marginBottom: 'var(--batione-space-3)' }} aria-hidden />
          <p style={{ fontSize: 'var(--batione-font-size-lg)', fontWeight: 600, color: 'var(--batione-ink-800)' }}>
            {recherche || statut ? 'Aucune dépense ne correspond à votre recherche' : 'Enregistrez votre première dépense'}
          </p>
          <p>Suivez chaque dépense depuis la saisie jusqu&apos;à son approbation.</p>
          <Link href="/finance/nouveau" className="bo-btn bo-btn--primary">
            Enregistrer une dépense
          </Link>
        </div>
      ) : (
        <>
          <div className="bo-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--batione-bg)', textAlign: 'left' }}>
                  {['Date', 'Fournisseur', 'Catégorie', 'Projet', 'Statut', 'Montant HT'].map((titre) => (
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
                {depenses.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => router.push(`/finance/${d.id}`)}
                    style={{ borderTop: '1px solid var(--batione-ink-100)', cursor: 'pointer' }}
                  >
                    <td style={cellStyle}>{formatDateMA(new Date(d.date_depense))}</td>
                    <td style={{ ...cellStyle, fontWeight: 600 }}>{d.fournisseur ?? '—'}</td>
                    <td style={cellStyle}>{d.categorie.nom}</td>
                    <td style={cellStyle}>{d.project ? `${d.project.code} · ${d.project.nom}` : '—'}</td>
                    <td style={cellStyle}>
                      <StatutOperationnelBadge statut={d.statut} />
                    </td>
                    <td style={{ ...cellStyle, fontWeight: 600 }}>{formatMAD(d.montant_ht)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--batione-ink-500)', fontSize: 'var(--batione-font-size-sm)', marginTop: 'var(--batione-space-3)' }}>
            {depenses.length} dépense{depenses.length > 1 ? 's' : ''} affichée{depenses.length > 1 ? 's' : ''} · Total {formatMAD(total)}
          </p>
        </>
      )}
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  padding: 'var(--batione-space-3) var(--batione-space-4)',
  fontSize: 'var(--batione-font-size-sm)',
  color: 'var(--batione-ink-800)',
};
