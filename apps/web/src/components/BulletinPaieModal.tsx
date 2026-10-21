'use client';

import { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Send,
  Lock,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { StatutOperationnel } from '@batione/shared-types';
import { formatMAD } from '@/lib/format';
import { StatutOperationnelBadge } from '@/components/StatutOperationnelBadge';
import { api } from '@/lib/api';

export interface PayslipDetail {
  id: string;
  periode_mois: number;
  periode_annee: number;
  salaire_base_mad: string;
  jours_travailles: string;
  taux_journalier_applique_mad: string;
  heures_sup_heures: string;
  heures_sup_mad: string;
  primes_mad: string;
  salaire_brut_mad: string;
  cnss_salarie_mad: string;
  amo_salarie_mad: string;
  ir_mad: string;
  acomptes_deduits_mad: string;
  salaire_net_mad: string;
  cnss_patronale_mad: string;
  amo_patronale_mad: string;
  charges_patronales_mad: string;
  cout_total_employeur_mad: string;
  statut: StatutOperationnel;
  motif_rejet?: string | null;
  extourne_de_id?: string | null;
  motif_extourne?: string | null;
  worker: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    cin?: string | null;
    cnss_num?: string | null;
    poste: string;
    type_contrat: string;
    date_embauche?: string | null;
    banque?: string | null;
    rib?: string | null;
    nombre_deductions_ir: number;
  };
  organization: {
    id: string;
    nom: string;
    ice: string;
    if_num?: string | null;
    rc?: string | null;
    cnss_employeur?: string | null;
    patente?: string | null;
    adresse?: string | null;
    ville?: string | null;
    telephone?: string | null;
  };
}

interface BulletinPaieModalProps {
  ouvert: boolean;
  bulletin: PayslipDetail | null;
  onFermer: () => void;
  onActionSucces: () => void;
}

const NOMS_MOIS = [
  '',
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export function BulletinPaieModal({
  ouvert,
  bulletin,
  onFermer,
  onActionSucces,
}: BulletinPaieModalProps) {
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [motifExtourne, setMotifExtourne] = useState('');
  const [panneauExtourne, setPanneauExtourne] = useState(false);

  if (!ouvert || !bulletin) return null;

  const moisNom = NOMS_MOIS[bulletin.periode_mois] || `Mois ${bulletin.periode_mois}`;

  async function executerAction(actionUrl: string, body?: Record<string, unknown>) {
    setErreur(null);
    setChargement(true);
    try {
      await api.post(actionUrl, body);
      onActionSucces();
      onFermer();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErreur(err.message);
      } else {
        setErreur('Une erreur est survenue lors de l’opération.');
      }
    } finally {
      setChargement(false);
    }
  }

  function imprimer() {
    window.print();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--batione-space-4)',
      }}
    >
      <div
        className="bo-card"
        style={{
          width: '100%',
          maxWidth: 820,
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: 'var(--batione-space-6)',
          borderRadius: 'var(--batione-radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          background: 'white',
        }}
      >
        {/* Barre d'outils du haut */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--batione-space-4)',
            paddingBottom: 'var(--batione-space-3)',
            borderBottom: '1px solid var(--batione-ink-100)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-3)' }}>
            <span style={{ fontSize: 'var(--batione-font-size-lg)', fontWeight: 700, color: 'var(--batione-ink-900)' }}>
              Bulletin de Paie — {moisNom} {bulletin.periode_annee}
            </span>
            <StatutOperationnelBadge statut={bulletin.statut} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-2)' }}>
            <button
              type="button"
              onClick={imprimer}
              className="bo-btn bo-btn--secondary"
              style={{ minHeight: 36, padding: '0 12px', fontSize: 'var(--batione-font-size-xs)' }}
            >
              <Printer size={15} /> Imprimer
            </button>
            <button
              type="button"
              onClick={onFermer}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--batione-ink-500)',
                padding: 4,
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {erreur && (
          <div
            style={{
              backgroundColor: 'var(--batione-danger-soft)',
              color: 'var(--batione-danger)',
              padding: 'var(--batione-space-3)',
              borderRadius: 'var(--batione-radius-md)',
              marginBottom: 'var(--batione-space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--batione-space-2)',
              fontSize: 'var(--batione-font-size-sm)',
            }}
          >
            <AlertCircle size={18} />
            {erreur}
          </div>
        )}

        {/* Le Bulletin Conforme Marocain (Zone imprimable) */}
        <div
          id="bulletin-imprimable"
          style={{
            border: '2px solid var(--batione-ink-800)',
            borderRadius: 'var(--batione-radius-md)',
            padding: 'var(--batione-space-5)',
            backgroundColor: '#ffffff',
            color: 'var(--batione-ink-900)',
            fontSize: 'var(--batione-font-size-sm)',
            marginBottom: 'var(--batione-space-5)',
          }}
        >
          {/* Header Bulletin */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: 'var(--batione-space-4)',
              borderBottom: '2px solid var(--batione-ink-800)',
              paddingBottom: 'var(--batione-space-4)',
              marginBottom: 'var(--batione-space-4)',
            }}
          >
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--batione-ink-900)' }}>
                {bulletin.organization.nom}
              </div>
              <div style={{ color: 'var(--batione-ink-700)', marginTop: 4, lineHeight: 1.5, fontSize: '0.8rem' }}>
                {bulletin.organization.adresse && <div>{bulletin.organization.adresse}</div>}
                <div>{bulletin.organization.ville || 'Casablanca'} — Maroc</div>
                <div><strong>ICE :</strong> {bulletin.organization.ice}</div>
                {bulletin.organization.cnss_employeur && (
                  <div><strong>N° CNSS Employeur :</strong> {bulletin.organization.cnss_employeur}</div>
                )}
                {bulletin.organization.if_num && <div><strong>IF :</strong> {bulletin.organization.if_num}</div>}
                {bulletin.organization.rc && <div><strong>RC :</strong> {bulletin.organization.rc}</div>}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--batione-ink-100)',
                padding: 'var(--batione-space-3)',
                borderRadius: 'var(--batione-radius-sm)',
                border: '1px solid var(--batione-ink-300)',
              }}
            >
              <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', marginBottom: 8, color: 'var(--batione-primary-strong)' }}>
                Bulletin de Paie
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--batione-ink-700)' }}>Période :</span>
                <strong>{moisNom} {bulletin.periode_annee}</strong>
                <span style={{ color: 'var(--batione-ink-700)' }}>Devise :</span>
                <strong>Dirham Marocain (MAD)</strong>
                <span style={{ color: 'var(--batione-ink-700)' }}>Statut :</span>
                <strong>{bulletin.statut}</strong>
              </div>
            </div>
          </div>

          {/* Infos Salarié */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--batione-space-4)',
              borderBottom: '1px solid var(--batione-ink-300)',
              paddingBottom: 'var(--batione-space-4)',
              marginBottom: 'var(--batione-space-4)',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
              <span style={{ color: 'var(--batione-ink-500)' }}>Matricule :</span>
              <strong>{bulletin.worker.matricule}</strong>
              <span style={{ color: 'var(--batione-ink-500)' }}>Nom & Prénom :</span>
              <strong>{bulletin.worker.nom} {bulletin.worker.prenom}</strong>
              <span style={{ color: 'var(--batione-ink-500)' }}>CIN :</span>
              <strong>{bulletin.worker.cin || '—'}</strong>
              <span style={{ color: 'var(--batione-ink-500)' }}>N° Immat. CNSS :</span>
              <strong>{bulletin.worker.cnss_num || '—'}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
              <span style={{ color: 'var(--batione-ink-500)' }}>Poste / Métier :</span>
              <strong>{bulletin.worker.poste}</strong>
              <span style={{ color: 'var(--batione-ink-500)' }}>Type de contrat :</span>
              <strong>{bulletin.worker.type_contrat}</strong>
              <span style={{ color: 'var(--batione-ink-500)' }}>Banque / RIB :</span>
              <span style={{ wordBreak: 'break-all' }}>
                {bulletin.worker.banque || 'Espèces'} {bulletin.worker.rib ? `(${bulletin.worker.rib})` : ''}
              </span>
              <span style={{ color: 'var(--batione-ink-500)' }}>Charges de famille :</span>
              <span>{bulletin.worker.nombre_deductions_ir} personne(s)</span>
            </div>
          </div>

          {/* Tableau de Paie Lignes */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
              marginBottom: 'var(--batione-space-4)',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: 'var(--batione-ink-900)', color: 'white' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Rubrique</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Base / Quantité</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Taux / Unité</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Gains (MAD)</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Retenues (MAD)</th>
              </tr>
            </thead>
            <tbody>
              {/* Ligne 1 : Salaire de base ou jours travaillés */}
              <tr style={{ borderBottom: '1px solid var(--batione-ink-100)' }}>
                <td style={{ padding: '8px 10px' }}>
                  {Number(bulletin.jours_travailles) > 0 ? 'Journées travaillées (pointage chantier)' : 'Salaire de base mensuel'}
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                  {Number(bulletin.jours_travailles) > 0 ? `${Number(bulletin.jours_travailles)} j` : '1 mois'}
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                  {Number(bulletin.taux_journalier_applique_mad) > 0
                    ? formatMAD(bulletin.taux_journalier_applique_mad)
                    : formatMAD(bulletin.salaire_base_mad)}
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                  {formatMAD(bulletin.salaire_base_mad)}
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>—</td>
              </tr>

              {/* Ligne 2 : Heures sup si > 0 */}
              {Number(bulletin.heures_sup_mad) > 0 && (
                <tr style={{ borderBottom: '1px solid var(--batione-ink-100)' }}>
                  <td style={{ padding: '8px 10px' }}>Heures supplémentaires (+25% légal)</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{Number(bulletin.heures_sup_heures)} h</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>Majoration 125%</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                    {formatMAD(bulletin.heures_sup_mad)}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>—</td>
                </tr>
              )}

              {/* Ligne 3 : Primes si > 0 */}
              {Number(bulletin.primes_mad) > 0 && (
                <tr style={{ borderBottom: '1px solid var(--batione-ink-100)' }}>
                  <td style={{ padding: '8px 10px' }}>Primes & Indemnités de chantier</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>—</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>—</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                    {formatMAD(bulletin.primes_mad)}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>—</td>
                </tr>
              )}

              {/* Total Brut Intermédiaire */}
              <tr style={{ backgroundColor: 'var(--batione-ink-100)', fontWeight: 700 }}>
                <td style={{ padding: '8px 10px' }} colSpan={3}>SALAIRE BRUT GLOBAL (SBG)</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--batione-ink-900)' }}>
                  {formatMAD(bulletin.salaire_brut_mad)}
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>—</td>
              </tr>

              {/* Retenue CNSS */}
              <tr style={{ borderBottom: '1px solid var(--batione-ink-100)' }}>
                <td style={{ padding: '8px 10px' }}>Cotisation CNSS Salariée (Prestations sociales)</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>Plafond 6 000 MAD</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>4,48 %</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>—</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--batione-danger)' }}>
                  {formatMAD(bulletin.cnss_salarie_mad)}
                </td>
              </tr>

              {/* Retenue AMO */}
              <tr style={{ borderBottom: '1px solid var(--batione-ink-100)' }}>
                <td style={{ padding: '8px 10px' }}>Cotisation AMO Salariée (Assurance Maladie)</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>Sans plafond</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>2,26 %</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>—</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--batione-danger)' }}>
                  {formatMAD(bulletin.amo_salarie_mad)}
                </td>
              </tr>

              {/* Retenue IR */}
              <tr style={{ borderBottom: '1px solid var(--batione-ink-100)' }}>
                <td style={{ padding: '8px 10px' }}>Impôt sur le Revenu (IR Net déduit à la source)</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>Après frais pro 35%</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>Barème CGI</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>—</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--batione-danger)' }}>
                  {formatMAD(bulletin.ir_mad)}
                </td>
              </tr>

              {/* Acomptes déduits */}
              {Number(bulletin.acomptes_deduits_mad) > 0 && (
                <tr style={{ borderBottom: '1px solid var(--batione-ink-100)' }}>
                  <td style={{ padding: '8px 10px' }}>Acomptes & Avances sur salaire perçus sur chantier</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>Régularisation</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>100 %</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>—</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--batione-danger)', fontWeight: 600 }}>
                    {formatMAD(bulletin.acomptes_deduits_mad)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Grand Encadré Net à Payer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--batione-space-4)',
              background: 'linear-gradient(135deg, var(--batione-primary-soft) 0%, #ffffff 100%)',
              border: '2px solid var(--batione-primary)',
              borderRadius: 'var(--batione-radius-md)',
              marginBottom: 'var(--batione-space-4)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--batione-primary-strong)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Net à payer au salarié
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)', marginTop: 2 }}>
                Règlement par {bulletin.worker.banque || 'Espèces'}
              </div>
            </div>

            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--batione-primary-strong)' }}>
              {formatMAD(bulletin.salaire_net_mad)}
            </div>
          </div>

          {/* Mention Charges Patronales pour gestion entreprise */}
          <div
            style={{
              padding: 'var(--batione-space-3)',
              backgroundColor: 'var(--batione-ink-100)',
              borderRadius: 'var(--batione-radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--batione-ink-700)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <strong>Charges patronales marocaines :</strong> CNSS employeur ({formatMAD(bulletin.cnss_patronale_mad)}) + AMO employeur ({formatMAD(bulletin.amo_patronale_mad)}) = <strong>{formatMAD(bulletin.charges_patronales_mad)}</strong>
            </div>
            <div>
              <strong>Coût total employeur :</strong> {formatMAD(bulletin.cout_total_employeur_mad)}
            </div>
          </div>
        </div>

        {/* Workflow du cycle à 4 états (Action Bar) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--batione-space-3)',
            borderTop: '1px solid var(--batione-ink-100)',
            paddingTop: 'var(--batione-space-4)',
          }}
        >
          <div style={{ fontSize: 'var(--batione-font-size-sm)', color: 'var(--batione-ink-500)' }}>
            Statut actuel : <strong>{bulletin.statut}</strong>
          </div>

          <div style={{ display: 'flex', gap: 'var(--batione-space-2)', flexWrap: 'wrap' }}>
            {bulletin.statut === StatutOperationnel.BROUILLON && (
              <button
                type="button"
                className="bo-btn bo-btn--primary"
                disabled={chargement}
                onClick={() => executerAction(`/paie/bulletins/${bulletin.id}/soumettre`)}
              >
                <Send size={16} /> Soumettre pour validation
              </button>
            )}

            {bulletin.statut === StatutOperationnel.SOUMIS && (
              <>
                <button
                  type="button"
                  className="bo-btn bo-btn--secondary"
                  disabled={chargement}
                  onClick={() => executerAction(`/paie/bulletins/${bulletin.id}/rejeter`, { motif: 'À corriger' })}
                  style={{ color: 'var(--batione-danger)' }}
                >
                  Rejeter en brouillon
                </button>
                <button
                  type="button"
                  className="bo-btn bo-btn--primary"
                  disabled={chargement}
                  onClick={() => executerAction(`/paie/bulletins/${bulletin.id}/approuver`)}
                >
                  <CheckCircle2 size={16} /> Approuver le bulletin
                </button>
              </>
            )}

            {bulletin.statut === StatutOperationnel.APPROUVE && (
              <button
                type="button"
                className="bo-btn bo-btn--primary"
                disabled={chargement}
                onClick={() => executerAction(`/paie/bulletins/${bulletin.id}/enregistrer`)}
                style={{ backgroundColor: 'var(--batione-success)' }}
              >
                <Lock size={16} /> Enregistrer & Sceller la paie
              </button>
            )}

            {bulletin.statut === StatutOperationnel.ENREGISTRE && (
              <button
                type="button"
                className="bo-btn bo-btn--secondary"
                disabled={chargement}
                onClick={() => setPanneauExtourne(!panneauExtourne)}
                style={{ color: 'var(--batione-danger)', borderColor: 'var(--batione-danger)' }}
              >
                <RotateCcw size={16} /> Extourner ce bulletin
              </button>
            )}
          </div>
        </div>

        {/* Panneau d'extourne avec motif obligatoire */}
        {panneauExtourne && (
          <div
            style={{
              marginTop: 'var(--batione-space-4)',
              padding: 'var(--batione-space-4)',
              backgroundColor: 'var(--batione-danger-soft)',
              borderRadius: 'var(--batione-radius-md)',
              border: '1px solid var(--batione-danger)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--batione-danger)', marginBottom: 'var(--batione-space-2)' }}>
              Demande d’extourne (Contre-passation réglementée)
            </div>
            <p style={{ fontSize: 'var(--batione-font-size-xs)', color: 'var(--batione-ink-700)', margin: '0 0 var(--batione-space-2)' }}>
              Cette action génère une écriture symétrique inverse à montants négatifs et libère les acomptes déduits. L’original reste inaltérable.
            </p>
            <input
              className="bo-input"
              placeholder="Motif obligatoire (ex. Erreur pointage ou régularisation conventionnelle)"
              value={motifExtourne}
              onChange={(e) => setMotifExtourne(e.target.value)}
              style={{ marginBottom: 'var(--batione-space-3)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--batione-space-2)' }}>
              <button
                type="button"
                className="bo-btn bo-btn--secondary"
                onClick={() => setPanneauExtourne(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="bo-btn bo-btn--primary"
                disabled={chargement || motifExtourne.trim().length < 5}
                style={{ backgroundColor: 'var(--batione-danger)' }}
                onClick={() =>
                  executerAction(`/paie/bulletins/${bulletin.id}/extourner`, {
                    motif_extourne: motifExtourne.trim(),
                  })
                }
              >
                Confirmer l’extourne
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
