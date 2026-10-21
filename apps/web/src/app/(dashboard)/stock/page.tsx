'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Package, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { formatMAD } from '@/lib/format';

interface ArticleLigne {
  id: string;
  code: string;
  nom: string;
  categorie: string | null;
  unite: string;
  prix_unitaire: string;
  quantite_disponible: string;
  seuil_alerte: string;
}

interface ReponseListe {
  donnees: ArticleLigne[];
  metadonnees: { total: number };
}

export default function PageStock() {
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [articles, setArticles] = useState<ArticleLigne[] | null>(null);
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (recherche) params.set('recherche', recherche);
      const reponse = await api.get<ReponseListe>(`/articles?${params.toString()}`);
      setArticles(reponse.donnees);
    } catch {
      setErreur('Impossible de charger les articles.');
    }
  }, [recherche]);

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
          <h1 style={{ fontSize: 'var(--batione-font-size-xl)', margin: 0 }}>Stock</h1>
          <p style={{ color: 'var(--batione-ink-500)', margin: '4px 0 0' }}>
            Articles, quantités disponibles et seuils d’alerte.
          </p>
        </div>
        <Link href="/stock/nouveau" className="bo-btn bo-btn--primary">
          <Plus size={18} aria-hidden />
          Nouvel article
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
            placeholder="Rechercher par code ou nom…"
            style={{ paddingLeft: 36 }}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </div>

      {erreur && <p className="bo-error-text">{erreur}</p>}

      {articles === null ? (
        <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>
      ) : articles.length === 0 ? (
        <div className="bo-card bo-empty-state">
          <Package size={40} color="var(--batione-ink-300)" style={{ marginBottom: 'var(--batione-space-3)' }} aria-hidden />
          <p style={{ fontSize: 'var(--batione-font-size-lg)', fontWeight: 600, color: 'var(--batione-ink-800)' }}>
            {recherche ? 'Aucun article ne correspond à votre recherche' : 'Ajoutez votre premier article'}
          </p>
          <p>Suivez vos quantités disponibles et vos mouvements de stock par projet.</p>
          <Link href="/stock/nouveau" className="bo-btn bo-btn--primary">
            Ajouter un article
          </Link>
        </div>
      ) : (
        <div className="bo-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--batione-bg)', textAlign: 'left' }}>
                {['Code', 'Nom', 'Catégorie', 'Disponible', 'Prix unitaire', ''].map((titre) => (
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
              {articles.map((article) => {
                const sousLeSeuil = Number(article.quantite_disponible) <= Number(article.seuil_alerte) && Number(article.seuil_alerte) > 0;
                return (
                  <tr
                    key={article.id}
                    onClick={() => router.push(`/stock/${article.id}`)}
                    style={{ borderTop: '1px solid var(--batione-ink-100)', cursor: 'pointer' }}
                  >
                    <td style={{ ...cellStyle, fontWeight: 600 }}>{article.code}</td>
                    <td style={cellStyle}>{article.nom}</td>
                    <td style={cellStyle}>{article.categorie ?? '—'}</td>
                    <td style={cellStyle}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {sousLeSeuil && <AlertTriangle size={14} color="var(--batione-warning)" aria-hidden />}
                        {Number(article.quantite_disponible).toLocaleString('fr-FR')} {article.unite}
                      </span>
                    </td>
                    <td style={cellStyle}>{formatMAD(article.prix_unitaire)}</td>
                    <td style={cellStyle} />
                  </tr>
                );
              })}
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
