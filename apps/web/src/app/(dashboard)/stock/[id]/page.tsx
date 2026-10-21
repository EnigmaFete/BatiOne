'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { TypeMouvementStock, LIBELLE_TYPE_MOUVEMENT } from '@batione/shared-types';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { formatMAD, formatDateMA } from '@/lib/format';

interface MouvementLigne {
  id: string;
  type: TypeMouvementStock;
  quantite: string;
  cout_unitaire: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  project: { id: string; code: string; nom: string } | null;
}

interface ArticleDetail {
  id: string;
  code: string;
  nom: string;
  categorie: string | null;
  unite: string;
  prix_unitaire: string;
  quantite_disponible: string;
  seuil_alerte: string;
  mouvements: MouvementLigne[];
}

interface ProjetOption {
  id: string;
  code: string;
  nom: string;
}

interface FormulaireMouvement {
  type: TypeMouvementStock;
  quantite: string;
  projectId: string;
  coutUnitaire: string;
  reference: string;
  notes: string;
}

const ETAT_INITIAL: FormulaireMouvement = {
  type: TypeMouvementStock.ENTREE,
  quantite: '',
  projectId: '',
  coutUnitaire: '',
  reference: '',
  notes: '',
};

export default function PageDetailArticle() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { moi, erreur: erreurAuth } = useAuth();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [projets, setProjets] = useState<ProjetOption[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [valeurs, setValeurs] = useState(ETAT_INITIAL);
  const [chargement, setChargement] = useState(false);

  const charger = useCallback(() => {
    api
      .get<ArticleDetail>(`/articles/${id}`)
      .then(setArticle)
      .catch((err) => {
        if (err instanceof ApiError && err.code === 'RESSOURCE_INTROUVABLE') {
          setErreur('Cet article est introuvable.');
        } else {
          setErreur('Impossible de charger cet article.');
        }
      });
  }, [id]);

  useEffect(() => {
    if (!moi) return;
    charger();
    api
      .get<{ donnees: ProjetOption[] }>('/projets')
      .then((r) => setProjets(r.donnees))
      .catch(() => setProjets([]));
  }, [moi, charger]);

  function majChamp<K extends keyof FormulaireMouvement>(champ: K, valeur: FormulaireMouvement[K]) {
    setValeurs((v) => ({ ...v, [champ]: valeur }));
  }

  async function soumettreMouvement(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await api.post('/mouvements-stock', {
        type: valeurs.type,
        articleId: id,
        quantite: Number(valeurs.quantite),
        projectId: valeurs.projectId || undefined,
        coutUnitaire: valeurs.coutUnitaire ? Number(valeurs.coutUnitaire) : undefined,
        reference: valeurs.reference || undefined,
        notes: valeurs.notes || undefined,
      });
      setValeurs(ETAT_INITIAL);
      charger();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Impossible d'enregistrer ce mouvement.");
    } finally {
      setChargement(false);
    }
  }

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;

  if (erreur && !article) {
    return (
      <div>
        <p className="bo-error-text">{erreur}</p>
        <Link href="/stock" className="bo-btn bo-btn--secondary">
          Retour au stock
        </Link>
      </div>
    );
  }

  if (!article) {
    return <p style={{ color: 'var(--batione-ink-500)' }}>Chargement…</p>;
  }

  const sousLeSeuil = Number(article.quantite_disponible) <= Number(article.seuil_alerte) && Number(article.seuil_alerte) > 0;

  return (
    <div style={{ maxWidth: 820 }}>
      <button
        type="button"
        onClick={() => router.push('/stock')}
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
        Retour au stock
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--batione-space-5)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--batione-font-size-xl)', margin: 0 }}>{article.nom}</h1>
          <p style={{ color: 'var(--batione-ink-500)', margin: '4px 0 0' }}>
            {article.code} · {article.categorie ?? 'Sans catégorie'}
          </p>
        </div>
      </div>

      {sousLeSeuil && (
        <div
          className="bo-card"
          style={{ marginBottom: 'var(--batione-space-4)', background: 'var(--batione-warning-soft)', display: 'flex', gap: 'var(--batione-space-3)', alignItems: 'center' }}
        >
          <AlertTriangle size={18} color="var(--batione-warning)" aria-hidden />
          <p style={{ margin: 0, fontSize: 'var(--batione-font-size-sm)' }}>
            Quantité disponible sous le seuil d’alerte ({article.seuil_alerte} {article.unite}).
          </p>
        </div>
      )}

      <div className="bo-card" style={{ marginBottom: 'var(--batione-space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--batione-space-4)' }}>
          <div>
            <p style={{ margin: 0, fontSize: 'var(--batione-font-size-xs)', color: 'var(--batione-ink-500)' }}>Disponible</p>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--batione-font-size-lg)' }}>
              {Number(article.quantite_disponible).toLocaleString('fr-FR')} {article.unite}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 'var(--batione-font-size-xs)', color: 'var(--batione-ink-500)' }}>Prix unitaire</p>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--batione-font-size-lg)' }}>{formatMAD(article.prix_unitaire)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 'var(--batione-font-size-xs)', color: 'var(--batione-ink-500)' }}>Seuil d’alerte</p>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--batione-font-size-lg)' }}>
              {Number(article.seuil_alerte).toLocaleString('fr-FR')} {article.unite}
            </p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 'var(--batione-font-size-lg)', margin: '0 0 var(--batione-space-3)' }}>Enregistrer un mouvement</h2>
      <form onSubmit={soumettreMouvement} className="bo-card" style={{ marginBottom: 'var(--batione-space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="type">
              Type
            </label>
            <select
              id="type"
              className="bo-input"
              value={valeurs.type}
              onChange={(e) => majChamp('type', e.target.value as TypeMouvementStock)}
            >
              {Object.values(TypeMouvementStock).map((t) => (
                <option key={t} value={t}>
                  {LIBELLE_TYPE_MOUVEMENT[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="quantite">
              {valeurs.type === TypeMouvementStock.AJUSTEMENT ? 'Nouvelle quantité (absolue)' : 'Quantité'}
            </label>
            <input
              id="quantite"
              className="bo-input"
              type="number"
              min={0}
              step="0.001"
              required
              value={valeurs.quantite}
              onChange={(e) => majChamp('quantite', e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--batione-space-4)' }}>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="projectId">
              Projet <span style={{ fontWeight: 400, color: 'var(--batione-ink-500)' }}>(optionnel)</span>
            </label>
            <select id="projectId" className="bo-input" value={valeurs.projectId} onChange={(e) => majChamp('projectId', e.target.value)}>
              <option value="">Aucun projet</option>
              {projets?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="bo-field" style={{ flex: 1 }}>
            <label className="bo-label" htmlFor="coutUnitaire">
              Coût unitaire (MAD) <span style={{ fontWeight: 400, color: 'var(--batione-ink-500)' }}>(optionnel)</span>
            </label>
            <input
              id="coutUnitaire"
              className="bo-input"
              type="number"
              min={0}
              step="0.01"
              value={valeurs.coutUnitaire}
              onChange={(e) => majChamp('coutUnitaire', e.target.value)}
            />
          </div>
        </div>

        <div className="bo-field">
          <label className="bo-label" htmlFor="reference">
            Référence <span style={{ fontWeight: 400, color: 'var(--batione-ink-500)' }}>(bon de livraison, bon de sortie…)</span>
          </label>
          <input id="reference" className="bo-input" value={valeurs.reference} onChange={(e) => majChamp('reference', e.target.value)} />
        </div>

        <div className="bo-field">
          <label className="bo-label" htmlFor="notes">
            Notes <span style={{ fontWeight: 400, color: 'var(--batione-ink-500)' }}>(optionnel)</span>
          </label>
          <input id="notes" className="bo-input" value={valeurs.notes} onChange={(e) => majChamp('notes', e.target.value)} />
        </div>

        {erreur && <p className="bo-error-text">{erreur}</p>}

        <button type="submit" className="bo-btn bo-btn--primary" disabled={chargement}>
          {chargement ? 'Enregistrement…' : 'Enregistrer le mouvement'}
        </button>
      </form>

      <h2 style={{ fontSize: 'var(--batione-font-size-lg)', margin: '0 0 var(--batione-space-3)' }}>Historique des mouvements</h2>
      {article.mouvements.length === 0 ? (
        <div className="bo-card bo-empty-state">
          <p>Aucun mouvement enregistré pour cet article.</p>
        </div>
      ) : (
        <div className="bo-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--batione-bg)', textAlign: 'left' }}>
                {['Date', 'Type', 'Quantité', 'Projet', 'Référence'].map((titre) => (
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
              {article.mouvements.map((m) => (
                <tr key={m.id} style={{ borderTop: '1px solid var(--batione-ink-100)' }}>
                  <td style={cellStyle}>{formatDateMA(new Date(m.created_at))}</td>
                  <td style={cellStyle}>{LIBELLE_TYPE_MOUVEMENT[m.type]}</td>
                  <td style={cellStyle}>
                    {m.type === TypeMouvementStock.SORTIE ? '−' : m.type === TypeMouvementStock.ENTREE ? '+' : '±'}
                    {Number(m.quantite).toLocaleString('fr-FR')} {article.unite}
                  </td>
                  <td style={cellStyle}>{m.project ? `${m.project.code} · ${m.project.nom}` : '—'}</td>
                  <td style={cellStyle}>{m.reference ?? '—'}</td>
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
