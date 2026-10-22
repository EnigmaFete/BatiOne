'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  Building,
  Calendar,
  DollarSign,
  HardHat,
  Package,
  Printer,
  Users,
  Wallet,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { formatMAD } from '@/lib/format';
import { KpiCard } from '@/components/KpiCard';

interface ProjectOption {
  id: string;
  code: string;
  nom: string;
}

interface SyntheseRapport {
  filtre: {
    periode: string;
    project_id?: string;
    project_nom?: string;
  };
  chantiers: {
    total_projets: number;
    projets_en_cours: number;
    budget_total_mad: number;
    consommation_budgetaire_pct: number;
  };
  finance: {
    depenses_enregistrees_mad: number;
    depenses_en_cours_validation_mad: number;
    depenses_totales_mad: number;
    repartition_categories: {
      category_id: string;
      nom: string;
      couleur: string;
      total_mad: number;
      pourcentage: number;
    }[];
  };
  rh: {
    effectif_total: number;
    journaliers: number;
    permanents: number;
    cout_main_doeuvre_pointage_mad: number;
    masse_salariale_brute_mad: number;
    masse_salariale_nette_mad: number;
    charges_patronales_mad: number;
    acomptes_totaux_mad: number;
    acomptes_en_attente_mad: number;
  };
  stock: {
    total_articles: number;
    valeur_stock_mad: number;
    articles_en_alerte: number;
    articles_en_rupture: number;
  };
  materiel: {
    total_engins: number;
    engins_en_service: number;
    engins_en_maintenance: number;
    valeur_parc_mad: number;
    taux_utilisation_pct: number;
  };
}

type TabRapport = 'synthese' | 'finance' | 'rh' | 'stock_materiel';

export default function PageRapports() {
  const { moi, erreur: erreurAuth } = useAuth();
  const [periode, setPeriode] = useState('mois_courant');
  const [projectId, setProjectId] = useState('');
  const [projets, setProjets] = useState<ProjectOption[]>([]);
  const [rapport, setRapport] = useState<SyntheseRapport | null>(null);
  const [chargement, setChargement] = useState(true);
  const [tabActive, setTabActive] = useState<TabRapport>('synthese');

  // Charger les projets
  useEffect(() => {
    async function chargerProjets() {
      try {
        const res = await api.get<{ donnees: ProjectOption[] }>('/projets?limite=100');
        if (res && res.donnees) {
          setProjets(res.donnees);
        }
      } catch {
        // Optionnel
      }
    }
    chargerProjets();
  }, []);

  // Charger la synthèse
  const chargerRapport = useCallback(async () => {
    setChargement(true);
    try {
      const params = new URLSearchParams();
      if (periode) params.set('periode', periode);
      if (projectId) params.set('project_id', projectId);

      const res = await api.get<SyntheseRapport>(`/rapports/synthese?${params.toString()}`);
      setRapport(res);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }, [periode, projectId]);

  useEffect(() => {
    if (!moi) return;
    chargerRapport();
  }, [moi, chargerRapport]);

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)', padding: 24 }}>Chargement…</p>;

  return (
    <div className="bo-rapports-page">
      {/* Header & Filtres */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--batione-space-5)',
          flexWrap: 'wrap',
          gap: 'var(--batione-space-3)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--batione-font-size-xl)',
              fontWeight: 800,
              color: 'var(--batione-ink-900)',
              marginBottom: 4,
            }}
          >
            Rapports & Analyses Opérationnelles
          </h1>
          <p style={{ color: 'var(--batione-ink-500)', fontSize: 'var(--batione-font-size-sm)' }}>
            Synthèse consolidée des coûts de chantiers, engagements financiers, masse salariale et inventaire.
          </p>
        </div>

        {/* Boutons d'export et impression */}
        <div style={{ display: 'flex', gap: 'var(--batione-space-2)' }}>
          <button
            type="button"
            className="bo-btn bo-btn--secondary"
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Printer size={16} /> Imprimer la synthèse
          </button>
        </div>
      </div>

      {/* Barre de contrôle Période & Chantier */}
      <div
        className="bo-card"
        style={{
          marginBottom: 'var(--batione-space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--batione-space-3)',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-4)', flexWrap: 'wrap' }}>
          {/* Sélecteur Période */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="var(--batione-ink-500)" />
            <span style={{ fontSize: 'var(--batione-font-size-sm)', fontWeight: 600 }}>Période :</span>
            <select
              className="bo-input"
              style={{ width: 180 }}
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
            >
              <option value="mois_courant">Mois en cours</option>
              <option value="trimestre">Trimestre en cours</option>
              <option value="annee_courante">Année en cours</option>
              <option value="tout">Tout l’historique</option>
            </select>
          </div>

          {/* Sélecteur Chantier */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building size={18} color="var(--batione-ink-500)" />
            <span style={{ fontSize: 'var(--batione-font-size-sm)', fontWeight: 600 }}>Chantier :</span>
            <select
              className="bo-input"
              style={{ width: 250 }}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Tous les chantiers (Consolidé)</option>
              {projets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        {rapport && (
          <div style={{ fontSize: 'var(--batione-font-size-xs)', color: 'var(--batione-ink-600)', fontWeight: 600 }}>
            Plage couverte : <span style={{ color: 'var(--batione-primary-strong)' }}>{rapport.filtre.periode}</span>
            {rapport.filtre.project_nom && (
              <span> • Chantier : {rapport.filtre.project_nom}</span>
            )}
          </div>
        )}
      </div>

      {/* Navigation par Onglets */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--batione-space-2)',
          borderBottom: '2px solid var(--batione-ink-100)',
          marginBottom: 'var(--batione-space-5)',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none',
        }}
      >
        <button
          type="button"
          onClick={() => setTabActive('synthese')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: tabActive === 'synthese' ? '3px solid var(--batione-primary)' : '3px solid transparent',
            color: tabActive === 'synthese' ? 'var(--batione-primary-strong)' : 'var(--batione-ink-500)',
            fontWeight: tabActive === 'synthese' ? 700 : 500,
            fontSize: 'var(--batione-font-size-sm)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          <BarChart3 size={18} />
          <span>Synthèse Générale</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActive('finance')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: tabActive === 'finance' ? '3px solid var(--batione-primary)' : '3px solid transparent',
            color: tabActive === 'finance' ? 'var(--batione-primary-strong)' : 'var(--batione-ink-500)',
            fontWeight: tabActive === 'finance' ? 700 : 500,
            fontSize: 'var(--batione-font-size-sm)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          <DollarSign size={18} />
          <span>Dépenses & Budgets</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActive('rh')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: tabActive === 'rh' ? '3px solid var(--batione-primary)' : '3px solid transparent',
            color: tabActive === 'rh' ? 'var(--batione-primary-strong)' : 'var(--batione-ink-500)',
            fontWeight: tabActive === 'rh' ? 700 : 500,
            fontSize: 'var(--batione-font-size-sm)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          <Users size={18} />
          <span>RH & Masse Salariale</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActive('stock_materiel')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: tabActive === 'stock_materiel' ? '3px solid var(--batione-primary)' : '3px solid transparent',
            color: tabActive === 'stock_materiel' ? 'var(--batione-primary-strong)' : 'var(--batione-ink-500)',
            fontWeight: tabActive === 'stock_materiel' ? 700 : 500,
            fontSize: 'var(--batione-font-size-sm)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          <Package size={18} />
          <span>Stocks & Matériel</span>
        </button>
      </div>

      {chargement && (
        <div className="bo-card" style={{ padding: 48, textAlign: 'center' }}>
          <p style={{ color: 'var(--batione-ink-500)' }}>Génération de la synthèse analytique…</p>
        </div>
      )}

      {!chargement && rapport && (
        <div>
          {/* ========================================================= */}
          {/* ONGLET 1 : SYNTHÈSE GÉNÉRALE                             */}
          {/* ========================================================= */}
          {tabActive === 'synthese' && (
            <div>
              {/* Cartes KPI Globales */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 'var(--batione-space-4)',
                  marginBottom: 'var(--batione-space-5)',
                }}
              >
                <KpiCard
                  icon={Wallet}
                  titre="Dépenses Enregistrées"
                  valeur={formatMAD(rapport.finance.depenses_enregistrees_mad)}
                  tendance={rapport.finance.depenses_enregistrees_mad > 0 ? 'info' : 'warning'}
                  sousTitre={`+ ${formatMAD(rapport.finance.depenses_en_cours_validation_mad)} en validation`}
                />

                <KpiCard
                  icon={HardHat}
                  titre="Budget Chantiers"
                  valeur={formatMAD(rapport.chantiers.budget_total_mad)}
                  tendance="success"
                  sousTitre={`${rapport.chantiers.projets_en_cours} chantiers en cours sur ${rapport.chantiers.total_projets}`}
                />

                <KpiCard
                  icon={Users}
                  titre="Masse Salariale Brute"
                  valeur={formatMAD(rapport.rh.masse_salariale_brute_mad)}
                  tendance="warning"
                  sousTitre={`${rapport.rh.effectif_total} collaborateurs actifs`}
                />

                <KpiCard
                  icon={Package}
                  titre="Valorisation Stock"
                  valeur={formatMAD(rapport.stock.valeur_stock_mad)}
                  tendance="info"
                  sousTitre={`${rapport.stock.total_articles} références en catalogue`}
                />
              </div>

              {/* Panneau Répartition des Coûts & Consommation Budgétaire */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: 'var(--batione-space-4)',
                }}
              >
                {/* Répartition par Catégorie */}
                <div className="bo-card">
                  <h2
                    style={{
                      fontSize: 'var(--batione-font-size-md)',
                      fontWeight: 700,
                      marginBottom: 'var(--batione-space-3)',
                      color: 'var(--batione-ink-900)',
                    }}
                  >
                    Répartition des Dépenses par Catégorie
                  </h2>

                  {rapport.finance.repartition_categories.length === 0 ? (
                    <p style={{ color: 'var(--batione-ink-500)', fontSize: 'var(--batione-font-size-sm)', padding: '24px 0' }}>
                      Aucune dépense enregistrée sur cette période.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {rapport.finance.repartition_categories.map((c) => (
                        <div key={c.category_id}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 'var(--batione-font-size-sm)',
                              marginBottom: 4,
                            }}
                          >
                            <span style={{ fontWeight: 600, color: 'var(--batione-ink-800)' }}>{c.nom}</span>
                            <span style={{ fontWeight: 700, color: 'var(--batione-ink-900)' }}>
                              {formatMAD(c.total_mad)} ({c.pourcentage}%)
                            </span>
                          </div>
                          <div
                            style={{
                              height: 8,
                              backgroundColor: 'var(--batione-ink-100)',
                              borderRadius: 4,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, Math.max(2, c.pourcentage))}%`,
                                height: '100%',
                                backgroundColor: c.couleur,
                                borderRadius: 4,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Synthèse du Chantier & Consommation */}
                <div className="bo-card">
                  <h2
                    style={{
                      fontSize: 'var(--batione-font-size-md)',
                      fontWeight: 700,
                      marginBottom: 'var(--batione-space-3)',
                      color: 'var(--batione-ink-900)',
                    }}
                  >
                    Indicateurs de Gestion
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 'var(--batione-font-size-sm)', color: 'var(--batione-ink-600)' }}>
                          Consommation Budgétaire (Dépenses / Budget)
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--batione-ink-900)' }}>
                          {rapport.chantiers.consommation_budgetaire_pct}%
                        </span>
                      </div>
                      <div style={{ height: 10, backgroundColor: 'var(--batione-ink-100)', borderRadius: 5, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, rapport.chantiers.consommation_budgetaire_pct)}%`,
                            height: '100%',
                            backgroundColor:
                              rapport.chantiers.consommation_budgetaire_pct > 90
                                ? 'var(--batione-danger)'
                                : rapport.chantiers.consommation_budgetaire_pct > 75
                                ? 'var(--batione-warning)'
                                : 'var(--batione-primary)',
                            borderRadius: 5,
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 12, borderTop: '1px solid var(--batione-ink-100)' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Taux Utilisation Matériel</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--batione-primary-strong)' }}>
                          {rapport.materiel.taux_utilisation_pct}%
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--batione-ink-500)' }}>
                          {rapport.materiel.engins_en_service}/{rapport.materiel.total_engins} engins affectés
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Articles en Rupture/Alerte</div>
                        <div
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            color: rapport.stock.articles_en_rupture > 0 ? 'var(--batione-danger)' : 'var(--batione-success)',
                          }}
                        >
                          {rapport.stock.articles_en_rupture + rapport.stock.articles_en_alerte}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--batione-ink-500)' }}>
                          {rapport.stock.articles_en_rupture} ruptures totales
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ONGLET 2 : DÉPENSES & BUDGETS                            */}
          {/* ========================================================= */}
          {tabActive === 'finance' && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 'var(--batione-space-3)',
                  marginBottom: 'var(--batione-space-4)',
                }}
              >
                <div className="bo-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--batione-success)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Dépenses Scellées (Enregistrées)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--batione-success)' }}>
                    {formatMAD(rapport.finance.depenses_enregistrees_mad)}
                  </div>
                </div>

                <div className="bo-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--batione-warning)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>En Cours de Validation</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--batione-warning)' }}>
                    {formatMAD(rapport.finance.depenses_en_cours_validation_mad)}
                  </div>
                </div>

                <div className="bo-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--batione-primary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Total Engagements Dépenses</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--batione-primary-strong)' }}>
                    {formatMAD(rapport.finance.depenses_totales_mad)}
                  </div>
                </div>
              </div>

              {/* Tableau de Répartition par Catégorie */}
              <div className="bo-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--batione-font-size-sm)' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--batione-ink-100)', borderBottom: '1px solid var(--batione-ink-300)' }}>
                      <th style={{ padding: '12px 16px' }}>Catégorie de Dépense</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Montant Engagé (MAD)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Part du Budget (%)</th>
                      <th style={{ padding: '12px 16px', width: 220 }}>Visualisation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rapport.finance.repartition_categories.map((c) => (
                      <tr key={c.category_id} style={{ borderBottom: '1px solid var(--batione-ink-100)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{c.nom}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>{formatMAD(c.total_mad)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>{c.pourcentage}%</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ height: 8, backgroundColor: 'var(--batione-ink-100)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, Math.max(2, c.pourcentage))}%`, height: '100%', backgroundColor: c.couleur }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ONGLET 3 : RH & MASSE SALARIALE                          */}
          {/* ========================================================= */}
          {tabActive === 'rh' && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 'var(--batione-space-3)',
                  marginBottom: 'var(--batione-space-4)',
                }}
              >
                <div className="bo-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--batione-ink-700)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Masse Salariale Brute (SBG)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{formatMAD(rapport.rh.masse_salariale_brute_mad)}</div>
                </div>

                <div className="bo-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--batione-success)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Salaires Nets Versés</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--batione-success)' }}>{formatMAD(rapport.rh.masse_salariale_nette_mad)}</div>
                </div>

                <div className="bo-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--batione-primary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Charges Patronales (CNSS/AMO/TFP)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--batione-primary-strong)' }}>{formatMAD(rapport.rh.charges_patronales_mad)}</div>
                </div>

                <div className="bo-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--batione-warning)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Coût Main d’Œuvre (Pointages)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--batione-warning)' }}>{formatMAD(rapport.rh.cout_main_doeuvre_pointage_mad)}</div>
                </div>
              </div>

              {/* Détails Effectifs & Acomptes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--batione-space-4)' }}>
                <div className="bo-card">
                  <h3 style={{ fontSize: 'var(--batione-font-size-md)', fontWeight: 700, marginBottom: 14 }}>
                    Structure des Effectifs
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--batione-ink-100)' }}>
                      <span style={{ color: 'var(--batione-ink-600)' }}>Effectif Total Actif</span>
                      <span style={{ fontWeight: 800 }}>{rapport.rh.effectif_total} collaborateurs</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--batione-ink-100)' }}>
                      <span style={{ color: 'var(--batione-ink-600)' }}>Permanents (CDI / CDD)</span>
                      <span style={{ fontWeight: 700, color: 'var(--batione-primary-strong)' }}>{rapport.rh.permanents}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: 'var(--batione-ink-600)' }}>Journaliers & Tâcherons</span>
                      <span style={{ fontWeight: 700, color: 'var(--batione-warning)' }}>{rapport.rh.journaliers}</span>
                    </div>
                  </div>
                </div>

                <div className="bo-card">
                  <h3 style={{ fontSize: 'var(--batione-font-size-md)', fontWeight: 700, marginBottom: 14 }}>
                    Avances & Acomptes de Chantier
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--batione-ink-100)' }}>
                      <span style={{ color: 'var(--batione-ink-600)' }}>Total Acomptes Octroyés</span>
                      <span style={{ fontWeight: 800 }}>{formatMAD(rapport.rh.acomptes_totaux_mad)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: 'var(--batione-ink-600)' }}>En Attente de Déduction sur Paie</span>
                      <span style={{ fontWeight: 700, color: 'var(--batione-warning)' }}>{formatMAD(rapport.rh.acomptes_en_attente_mad)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ONGLET 4 : STOCKS & MATÉRIEL                             */}
          {/* ========================================================= */}
          {tabActive === 'stock_materiel' && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 'var(--batione-space-3)',
                  marginBottom: 'var(--batione-space-4)',
                }}
              >
                <div className="bo-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--batione-primary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Valeur Totale du Stock</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--batione-primary-strong)' }}>
                    {formatMAD(rapport.stock.valeur_stock_mad)}
                  </div>
                </div>

                <div className="bo-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--batione-info)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Références d’Articles</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--batione-info)' }}>
                    {rapport.stock.total_articles}
                  </div>
                </div>

                <div className="bo-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--batione-success)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Taux Affectation Parc Engins</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--batione-success)' }}>
                    {rapport.materiel.taux_utilisation_pct}%
                  </div>
                </div>

                <div className="bo-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--batione-danger)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Articles en Rupture / Alerte</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--batione-danger)' }}>
                    {rapport.stock.articles_en_rupture + rapport.stock.articles_en_alerte}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--batione-space-4)' }}>
                <div className="bo-card">
                  <h3 style={{ fontSize: 'var(--batione-font-size-md)', fontWeight: 700, marginBottom: 14 }}>
                    Disponibilité des Engins
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--batione-ink-100)' }}>
                      <span style={{ color: 'var(--batione-ink-600)' }}>Total Engins & Matériel</span>
                      <span style={{ fontWeight: 800 }}>{rapport.materiel.total_engins}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--batione-ink-100)' }}>
                      <span style={{ color: 'var(--batione-ink-600)' }}>Affectés sur Chantiers</span>
                      <span style={{ fontWeight: 700, color: 'var(--batione-success)' }}>{rapport.materiel.engins_en_service}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: 'var(--batione-ink-600)' }}>En Maintenance / Révision</span>
                      <span style={{ fontWeight: 700, color: 'var(--batione-warning)' }}>{rapport.materiel.engins_en_maintenance}</span>
                    </div>
                  </div>
                </div>

                <div className="bo-card">
                  <h3 style={{ fontSize: 'var(--batione-font-size-md)', fontWeight: 700, marginBottom: 14 }}>
                    Santé de l’Inventaire Matériaux
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--batione-ink-100)' }}>
                      <span style={{ color: 'var(--batione-ink-600)' }}>Articles en Rupture Totale (Stock = 0)</span>
                      <span style={{ fontWeight: 800, color: rapport.stock.articles_en_rupture > 0 ? 'var(--batione-danger)' : 'var(--batione-success)' }}>
                        {rapport.stock.articles_en_rupture}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: 'var(--batione-ink-600)' }}>Articles sous Seuil d’Alerte</span>
                      <span style={{ fontWeight: 700, color: 'var(--batione-warning)' }}>{rapport.stock.articles_en_alerte}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
