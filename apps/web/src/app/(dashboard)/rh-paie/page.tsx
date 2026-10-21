'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  CalendarCheck,
  DollarSign,
  FileSpreadsheet,
  Plus,
  Search,
  Zap,
  Save,
  CheckCircle,
  Eye,
  TrendingUp,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building,
} from 'lucide-react';
import {
  TypeContratWorker,
  StatutPresence,
  LIBELLE_TYPE_CONTRAT_WORKER,
} from '@batione/shared-types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { formatMAD } from '@/lib/format';
import { StatutOperationnelBadge } from '@/components/StatutOperationnelBadge';
import { WorkerModal, WorkerData } from '@/components/WorkerModal';
import { AcompteModal } from '@/components/AcompteModal';
import { BulletinPaieModal, PayslipDetail } from '@/components/BulletinPaieModal';

type TabType = 'ouvriers' | 'pointage' | 'acomptes' | 'paie';

interface WorkerItem extends WorkerData {
  id: string;
  created_at: string;
}

interface PointageLigneAffichage {
  worker_id: string;
  matricule: string;
  nom: string;
  prenom: string;
  poste: string;
  type_contrat: TypeContratWorker;
  taux_journalier_mad: string | number;
  taux_horaire_mad: string | number;
  statut_presence: StatutPresence;
  heures_normales: number;
  heures_sup: number;
  cout_journee_mad: number;
  notes: string;
}

interface PointageJournee {
  date_pointage: string;
  pointage_id: string | null;
  notes: string;
  total_ouvriers: number;
  presents: number;
  demi_journees: number;
  absents: number;
  cout_total_journee_mad: number;
  lignes: PointageLigneAffichage[];
}

interface AcompteItem {
  id: string;
  worker_id: string;
  date_acompte: string;
  montant_mad: string;
  mode_paiement: string;
  motif: string | null;
  deduit_paie: boolean;
  worker: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    poste: string;
  };
  project?: {
    id: string;
    code: string;
    nom: string;
  } | null;
}

interface PaieRecapitulatif {
  periode_annee: number;
  periode_mois: number;
  total_bulletins: number;
  totaux: {
    salaire_brut_total: number;
    cnss_salarie_total: number;
    amo_salarie_total: number;
    ir_total: number;
    acomptes_total: number;
    salaire_net_total: number;
    charges_patronales_total: number;
    cout_employeur_total: number;
  };
  bulletins: PayslipDetail[];
}

interface ProjectSelectOption {
  id: string;
  code: string;
  nom: string;
}

const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function ContenuRhPaie() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { moi, erreur: erreurAuth } = useAuth();

  const tabInitiale = (searchParams.get('tab') as TabType) || 'ouvriers';
  const [tabActive, setTabActive] = useState<TabType>(tabInitiale);

  // Données globales
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [projets, setProjets] = useState<ProjectSelectOption[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Tab 1 : Collaborateurs
  const [rechercheWorker, setRechercheWorker] = useState('');
  const [filtreContrat, setFiltreContrat] = useState<string>('');
  const [modalWorkerOuvert, setModalWorkerOuvert] = useState(false);
  const [workerAEditer, setWorkerAEditer] = useState<WorkerItem | null>(null);

  // Tab 2 : Pointage quotidien
  const aujourdhuiStr = new Date().toISOString().split('T')[0];
  const [datePointage, setDatePointage] = useState(aujourdhuiStr);
  const [projetPointageId, setProjetPointageId] = useState<string>('');
  const [pointageJour, setPointageJour] = useState<PointageJournee | null>(null);
  const [notesPointage, setNotesPointage] = useState('');
  const [sauvegardePointageEnCours, setSauvegardePointageEnCours] = useState(false);

  // Tab 3 : Acomptes
  const [acomptes, setAcomptes] = useState<AcompteItem[]>([]);
  const [modalAcompteOuvert, setModalAcompteOuvert] = useState(false);
  const [filtreAcompteNonDeduit, setFiltreAcompteNonDeduit] = useState(false);

  // Tab 4 : Paie & Bulletins
  const dateActuelle = new Date();
  const [anneePaie, setAnneePaie] = useState(dateActuelle.getFullYear());
  const [moisPaie, setMoisPaie] = useState(dateActuelle.getMonth() + 1);
  const [paieRecap, setPaieRecap] = useState<PaieRecapitulatif | null>(null);
  const [calculPaieEnCours, setCalculPaieEnCours] = useState(false);
  const [bulletinSelectionne, setBulletinSelectionne] = useState<PayslipDetail | null>(null);

  // Charger les projets pour les listes déroulantes
  useEffect(() => {
    async function chargerProjets() {
      try {
        const res = await api.get<{ donnees: ProjectSelectOption[] }>('/projets?limite=100');
        if (res.donnees) setProjets(res.donnees);
      } catch {
        // Optionnel
      }
    }
    chargerProjets();
  }, []);

  // 1. Charger les collaborateurs
  const chargerWorkers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (rechercheWorker) params.set('recherche', rechercheWorker);
      if (filtreContrat) params.set('type_contrat', filtreContrat);
      const res = await api.get<WorkerItem[] | { donnees: WorkerItem[] }>(`/workers?${params.toString()}`);
      const liste = Array.isArray(res) ? res : Array.isArray((res as { donnees?: WorkerItem[] })?.donnees) ? (res as { donnees: WorkerItem[] }).donnees : [];
      setWorkers(liste);
    } catch (e) {
      console.error(e);
      setWorkers([]);
    }
  }, [rechercheWorker, filtreContrat]);

  // 2. Charger le pointage du jour
  const chargerPointageJour = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('date', datePointage);
      if (projetPointageId) params.set('project_id', projetPointageId);
      const res = await api.get<PointageJournee | { donnees: PointageJournee }>(`/pointages/date?${params.toString()}`);
      const donnees = (res as PointageJournee)?.lignes ? (res as PointageJournee) : (res as { donnees?: PointageJournee })?.donnees?.lignes ? (res as { donnees: PointageJournee }).donnees : null;
      setPointageJour(donnees);
      if (donnees?.notes) setNotesPointage(donnees.notes);
    } catch (e) {
      console.error(e);
    }
  }, [datePointage, projetPointageId]);

  // 3. Charger les acomptes
  const chargerAcomptes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filtreAcompteNonDeduit) params.set('non_deduits', 'true');
      const res = await api.get<AcompteItem[] | { donnees: AcompteItem[] }>(`/acomptes?${params.toString()}`);
      const liste = Array.isArray(res) ? res : Array.isArray((res as { donnees?: AcompteItem[] })?.donnees) ? (res as { donnees: AcompteItem[] }).donnees : [];
      setAcomptes(liste);
    } catch (e) {
      console.error(e);
      setAcomptes([]);
    }
  }, [filtreAcompteNonDeduit]);

  // 4. Charger la paie
  const chargerPaie = useCallback(async () => {
    try {
      const res = await api.get<PaieRecapitulatif | { donnees: PaieRecapitulatif }>(
        `/paie/bulletins?annee=${anneePaie}&mois=${moisPaie}`
      );
      const donnees = (res as PaieRecapitulatif)?.totaux ? (res as PaieRecapitulatif) : (res as { donnees?: PaieRecapitulatif })?.donnees?.totaux ? (res as { donnees: PaieRecapitulatif }).donnees : null;
      setPaieRecap(donnees);
    } catch (e) {
      console.error(e);
    }
  }, [anneePaie, moisPaie]);

  // Synchronisation globale dès la connexion : tous les compteurs d'onglets sont renseignés
  useEffect(() => {
    if (!moi) return;
    chargerWorkers();
    chargerPointageJour();
    chargerAcomptes();
    chargerPaie();
  }, [moi, chargerWorkers, chargerPointageJour, chargerAcomptes, chargerPaie]);

  // Navigation par tab
  function changerTab(t: TabType) {
    setTabActive(t);
    router.replace(`/rh-paie?tab=${t}`);
  }

  function afficherAlerte(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  }

  // --- Actions Pointage ---
  function toutMarquerPresent() {
    if (!pointageJour) return;
    const maj = pointageJour.lignes.map((l) => ({
      ...l,
      statut_presence: StatutPresence.PRESENT,
      heures_normales: 8,
      cout_journee_mad: Number(l.taux_journalier_mad) + (l.heures_sup || 0) * (Number(l.taux_horaire_mad) || Number(l.taux_journalier_mad) / 8) * 1.25,
    }));
    setPointageJour({
      ...pointageJour,
      presents: maj.length,
      demi_journees: 0,
      absents: 0,
      lignes: maj,
      cout_total_journee_mad: maj.reduce((acc, curr) => acc + curr.cout_journee_mad, 0),
    });
  }

  function changerPresenceLigne(workerId: string, nouveauStatut: StatutPresence) {
    if (!pointageJour) return;
    const maj = pointageJour.lignes.map((l) => {
      if (l.worker_id !== workerId) return l;

      let fraction = 0;
      let heures = 0;
      if (nouveauStatut === StatutPresence.PRESENT) {
        fraction = 1;
        heures = 8;
      } else if (nouveauStatut === StatutPresence.DEMI_JOURNEE) {
        fraction = 0.5;
        heures = 4;
      }

      const tauxJour = Number(l.taux_journalier_mad) || 0;
      const tauxHeure = Number(l.taux_horaire_mad) || (tauxJour > 0 ? tauxJour / 8 : 0);
      const coutTotal = Math.round((fraction * tauxJour + l.heures_sup * tauxHeure * 1.25) * 100) / 100;

      return {
        ...l,
        statut_presence: nouveauStatut,
        heures_normales: heures,
        cout_journee_mad: coutTotal,
      };
    });

    setPointageJour({
      ...pointageJour,
      presents: maj.filter((x) => x.statut_presence === StatutPresence.PRESENT).length,
      demi_journees: maj.filter((x) => x.statut_presence === StatutPresence.DEMI_JOURNEE).length,
      absents: maj.filter((x) => x.statut_presence === StatutPresence.ABSENT).length,
      lignes: maj,
      cout_total_journee_mad: maj.reduce((acc, curr) => acc + curr.cout_journee_mad, 0),
    });
  }

  function modifierHeuresSupLigne(workerId: string, delta: number) {
    if (!pointageJour) return;
    const maj = pointageJour.lignes.map((l) => {
      if (l.worker_id !== workerId) return l;
      const nouvellesHeuresSup = Math.max(0, l.heures_sup + delta);

      let fraction = 0;
      if (l.statut_presence === StatutPresence.PRESENT) fraction = 1;
      else if (l.statut_presence === StatutPresence.DEMI_JOURNEE) fraction = 0.5;

      const tauxJour = Number(l.taux_journalier_mad) || 0;
      const tauxHeure = Number(l.taux_horaire_mad) || (tauxJour > 0 ? tauxJour / 8 : 0);
      const coutTotal = Math.round((fraction * tauxJour + nouvellesHeuresSup * tauxHeure * 1.25) * 100) / 100;

      return {
        ...l,
        heures_sup: nouvellesHeuresSup,
        cout_journee_mad: coutTotal,
      };
    });

    setPointageJour({
      ...pointageJour,
      lignes: maj,
      cout_total_journee_mad: maj.reduce((acc, curr) => acc + curr.cout_journee_mad, 0),
    });
  }

  async function enregistrerPointage() {
    if (!pointageJour) return;
    setSauvegardePointageEnCours(true);
    try {
      await api.post('/pointages/batch', {
        date_pointage: datePointage,
        project_id: projetPointageId || undefined,
        notes: notesPointage.trim() || undefined,
        lignes: pointageJour.lignes.map((l) => ({
          worker_id: l.worker_id,
          statut_presence: l.statut_presence,
          heures_normales: l.heures_normales,
          heures_sup: l.heures_sup,
          cout_journee_mad: l.cout_journee_mad,
          notes: l.notes || undefined,
        })),
      });
      afficherAlerte(`Pointage du ${datePointage} enregistré avec succès !`);
      chargerPointageJour();
    } catch (e: unknown) {
      if (e instanceof Error) afficherAlerte(`Erreur : ${e.message}`);
    } finally {
      setSauvegardePointageEnCours(false);
    }
  }

  function changerJour(delta: number) {
    const d = new Date(datePointage);
    d.setDate(d.getDate() + delta);
    setDatePointage(d.toISOString().split('T')[0]);
  }

  // --- Actions Paie ---
  async function calculerPaieMois() {
    setCalculPaieEnCours(true);
    try {
      await api.post('/paie/generer', {
        periode_annee: anneePaie,
        periode_mois: moisPaie,
      });
      afficherAlerte(`Paie de ${MOIS_FR[moisPaie - 1]} ${anneePaie} calculée avec succès !`);
      chargerPaie();
    } catch (e: unknown) {
      if (e instanceof Error) afficherAlerte(`Erreur : ${e.message}`);
    } finally {
      setCalculPaieEnCours(false);
    }
  }

  if (erreurAuth) return <p className="bo-error-text">{erreurAuth}</p>;
  if (!moi) return <p style={{ color: 'var(--batione-ink-500)', padding: 24 }}>Chargement…</p>;

  // KPIs rapides de l'équipe
  const listeWorkers = Array.isArray(workers) ? workers : [];
  const totalWorkers = listeWorkers.length;
  const journaliersCount = listeWorkers.filter((w) => w?.type_contrat === TypeContratWorker.JOURNALIER).length;
  const cdiCount = listeWorkers.filter((w) => w?.type_contrat === TypeContratWorker.CDI || w?.type_contrat === TypeContratWorker.CDD).length;
  const masseSalarialeEstimee = listeWorkers.reduce((acc, w) => {
    if (w?.salaire_base_mad && Number(w.salaire_base_mad) > 0) return acc + Number(w.salaire_base_mad);
    return acc + (Number(w?.taux_journalier_mad) || 0) * 22; // estimation 22 jours/mois pour un journalier
  }, 0);

  const totalAcomptes = Array.isArray(acomptes) ? acomptes.length : 0;
  const totalBulletins = paieRecap?.total_bulletins ?? (Array.isArray(paieRecap?.bulletins) ? paieRecap.bulletins.length : 0);

  return (
    <div>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 1100,
            backgroundColor: 'var(--batione-ink-900)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 'var(--batione-radius-md)',
            boxShadow: 'var(--batione-shadow-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 'var(--batione-font-size-sm)',
            borderLeft: '4px solid var(--batione-primary)',
          }}
        >
          <CheckCircle size={18} color="var(--batione-primary)" />
          {notification}
        </div>
      )}

      {/* Titre & Action Bar */}
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
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--batione-space-2)',
              color: 'var(--batione-ink-900)',
            }}
          >
            <Users size={24} color="var(--batione-primary)" />
            RH, Main d’Œuvre & Paie Marocaine
          </h1>
          <p style={{ color: 'var(--batione-ink-500)', margin: '4px 0 0' }}>
            Gestion du personnel de chantier, pointage mobile quotidien et paie conforme CNSS / AMO / IR.
          </p>
        </div>

        <div>
          {tabActive === 'ouvriers' && (
            <button
              type="button"
              className="bo-btn bo-btn--primary"
              onClick={() => {
                setWorkerAEditer(null);
                setModalWorkerOuvert(true);
              }}
            >
              <Plus size={18} /> Nouveau collaborateur
            </button>
          )}

          {tabActive === 'pointage' && (
            <button
              type="button"
              className="bo-btn bo-btn--primary"
              disabled={sauvegardePointageEnCours}
              onClick={enregistrerPointage}
            >
              <Save size={18} /> {sauvegardePointageEnCours ? 'Enregistrement…' : 'Enregistrer le pointage'}
            </button>
          )}

          {tabActive === 'acomptes' && (
            <button
              type="button"
              className="bo-btn bo-btn--primary"
              onClick={() => setModalAcompteOuvert(true)}
            >
              <Plus size={18} /> Remettre un acompte
            </button>
          )}

          {tabActive === 'paie' && (
            <button
              type="button"
              className="bo-btn bo-btn--primary"
              disabled={calculPaieEnCours}
              onClick={calculerPaieMois}
            >
              <Zap size={18} /> {calculPaieEnCours ? 'Calcul en cours…' : 'Calculer la paie du mois'}
            </button>
          )}
        </div>
      </div>

      {/* Barre d'onglets principale avec badges */}
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
          onClick={() => changerTab('ouvriers')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: tabActive === 'ouvriers' ? '3px solid var(--batione-primary)' : '3px solid transparent',
            color: tabActive === 'ouvriers' ? 'var(--batione-primary-strong)' : 'var(--batione-ink-500)',
            fontWeight: tabActive === 'ouvriers' ? 700 : 500,
            fontSize: 'var(--batione-font-size-sm)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          <Users size={18} />
          <span>Collaborateurs</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 9999,
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: tabActive === 'ouvriers' ? 'var(--batione-primary-soft)' : 'var(--batione-ink-100)',
              color: tabActive === 'ouvriers' ? 'var(--batione-primary-strong)' : 'var(--batione-ink-700)',
            }}
          >
            {totalWorkers}
          </span>
        </button>

        <button
          type="button"
          onClick={() => changerTab('pointage')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: tabActive === 'pointage' ? '3px solid var(--batione-primary)' : '3px solid transparent',
            color: tabActive === 'pointage' ? 'var(--batione-primary-strong)' : 'var(--batione-ink-500)',
            fontWeight: tabActive === 'pointage' ? 700 : 500,
            fontSize: 'var(--batione-font-size-sm)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          <CalendarCheck size={18} />
          <span>Pointage Quotidien Chantier</span>
          {pointageJour && pointageJour.total_ouvriers > 0 && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 9999,
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: tabActive === 'pointage' ? 'var(--batione-primary-soft)' : 'var(--batione-ink-100)',
                color: tabActive === 'pointage' ? 'var(--batione-primary-strong)' : 'var(--batione-ink-700)',
              }}
            >
              {pointageJour.presents}/{pointageJour.total_ouvriers}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => changerTab('acomptes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: tabActive === 'acomptes' ? '3px solid var(--batione-primary)' : '3px solid transparent',
            color: tabActive === 'acomptes' ? 'var(--batione-primary-strong)' : 'var(--batione-ink-500)',
            fontWeight: tabActive === 'acomptes' ? 700 : 500,
            fontSize: 'var(--batione-font-size-sm)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          <DollarSign size={18} />
          <span>Acomptes sur Salaire</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 9999,
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: tabActive === 'acomptes' ? 'var(--batione-primary-soft)' : 'var(--batione-ink-100)',
              color: tabActive === 'acomptes' ? 'var(--batione-primary-strong)' : 'var(--batione-ink-700)',
            }}
          >
            {totalAcomptes}
          </span>
        </button>

        <button
          type="button"
          onClick={() => changerTab('paie')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: tabActive === 'paie' ? '3px solid var(--batione-primary)' : '3px solid transparent',
            color: tabActive === 'paie' ? 'var(--batione-primary-strong)' : 'var(--batione-ink-500)',
            fontWeight: tabActive === 'paie' ? 700 : 500,
            fontSize: 'var(--batione-font-size-sm)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          <FileSpreadsheet size={18} />
          <span>Paie & Bulletins Marocains</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 9999,
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: tabActive === 'paie' ? 'var(--batione-primary-soft)' : 'var(--batione-ink-100)',
              color: tabActive === 'paie' ? 'var(--batione-primary-strong)' : 'var(--batione-ink-700)',
            }}
          >
            {totalBulletins}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* ONGLET 1 : COLLABORATEURS & OUVRIERS                      */}
      {/* ========================================================= */}
      {tabActive === 'ouvriers' && (
        <div>
          {/* KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 'var(--batione-space-4)',
              marginBottom: 'var(--batione-space-5)',
            }}
          >
            <div className="bo-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ backgroundColor: 'var(--batione-primary-soft)', padding: 12, borderRadius: 12 }}>
                <Users size={24} color="var(--batione-primary)" />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--batione-ink-500)' }}>Effectif Total</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{totalWorkers} collaborateurs</div>
              </div>
            </div>

            <div className="bo-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ backgroundColor: '#e0f2fe', padding: 12, borderRadius: 12 }}>
                <Briefcase size={24} color="#0284c7" />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--batione-ink-500)' }}>Journaliers BTP</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{journaliersCount} ouvriers</div>
              </div>
            </div>

            <div className="bo-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ backgroundColor: '#dcfce7', padding: 12, borderRadius: 12 }}>
                <UserCheck size={24} color="#16a34a" />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--batione-ink-500)' }}>Permanents (CDI/CDD)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{cdiCount} salariés</div>
              </div>
            </div>

            <div className="bo-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ backgroundColor: '#fef3c7', padding: 12, borderRadius: 12 }}>
                <TrendingUp size={24} color="#d97706" />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--batione-ink-500)' }}>Masse Mensuelle Est.</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{formatMAD(masseSalarialeEstimee)}</div>
              </div>
            </div>
          </div>

          {/* Filtres & Recherche */}
          <div
            className="bo-card"
            style={{
              marginBottom: 'var(--batione-space-4)',
              display: 'flex',
              gap: 'var(--batione-space-3)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Search
                size={16}
                color="var(--batione-ink-500)"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                className="bo-input"
                placeholder="Rechercher par nom, prénom, CIN marocaine, poste..."
                style={{ paddingLeft: 36 }}
                value={rechercheWorker}
                onChange={(e) => setRechercheWorker(e.target.value)}
              />
            </div>

            <select
              className="bo-input"
              style={{ width: 220 }}
              value={filtreContrat}
              onChange={(e) => setFiltreContrat(e.target.value)}
            >
              <option value="">Tous les types de contrat</option>
              {Object.values(TypeContratWorker).map((t) => (
                <option key={t} value={t}>
                  {LIBELLE_TYPE_CONTRAT_WORKER[t]}
                </option>
              ))}
            </select>
          </div>

          {/* Tableau des Collaborateurs */}
          {workers.length === 0 ? (
            <div className="bo-card bo-empty-state" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Users size={48} color="var(--batione-ink-300)" style={{ marginBottom: 16 }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>Aucun collaborateur enregistré</h3>
              <p style={{ color: 'var(--batione-ink-500)', margin: '0 0 20px', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
                Créez les fiches de vos ouvriers de chantier et salariés pour activer le pointage quotidien et le calcul de la paie marocaine.
              </p>
              <button
                type="button"
                className="bo-btn bo-btn--primary"
                onClick={() => {
                  setWorkerAEditer(null);
                  setModalWorkerOuvert(true);
                }}
              >
                <Plus size={18} /> Ajouter le premier collaborateur
              </button>
            </div>
          ) : (
            <div className="bo-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--batione-font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--batione-ink-100)', color: 'var(--batione-ink-700)', borderBottom: '1px solid var(--batione-ink-300)' }}>
                    <th style={{ padding: '12px 16px' }}>Collaborateur</th>
                    <th style={{ padding: '12px 16px' }}>CIN</th>
                    <th style={{ padding: '12px 16px' }}>Poste / Métier</th>
                    <th style={{ padding: '12px 16px' }}>Contrat</th>
                    <th style={{ padding: '12px 16px' }}>Rémunération</th>
                    <th style={{ padding: '12px 16px' }}>Banque & RIB</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w) => (
                    <tr
                      key={w.id}
                      style={{
                        borderBottom: '1px solid var(--batione-ink-100)',
                        transition: 'background-color 0.1s ease',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--batione-ink-900)' }}>
                          {w.nom} {w.prenom}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>
                          {w.matricule} • {w.telephone || 'Sans tél'}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {w.cin ? (
                          <span style={{ fontWeight: 600, color: 'var(--batione-ink-800)', letterSpacing: '0.04em' }}>
                            {w.cin}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--batione-ink-400)' }}>—</span>
                        )}
                        {w.cnss_num && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--batione-ink-500)' }}>
                            CNSS : {w.cnss_num}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 'var(--batione-radius-sm)',
                            backgroundColor: 'var(--batione-primary-soft)',
                            color: 'var(--batione-primary-strong)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                          }}
                        >
                          {w.poste}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 'var(--batione-radius-sm)',
                            backgroundColor: w.type_contrat === TypeContratWorker.JOURNALIER ? '#e0f2fe' : '#dcfce7',
                            color: w.type_contrat === TypeContratWorker.JOURNALIER ? '#0369a1' : '#15803d',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {LIBELLE_TYPE_CONTRAT_WORKER[w.type_contrat] || w.type_contrat}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {Number(w.taux_journalier_mad) > 0 && (
                          <div style={{ fontWeight: 700, color: 'var(--batione-ink-900)' }}>
                            {formatMAD(w.taux_journalier_mad)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--batione-ink-500)' }}>/jour</span>
                          </div>
                        )}
                        {Number(w.salaire_base_mad) > 0 && (
                          <div style={{ fontWeight: 700, color: 'var(--batione-ink-900)' }}>
                            {formatMAD(w.salaire_base_mad)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--batione-ink-500)' }}>/mois</span>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--batione-ink-800)' }}>
                          {w.banque || 'Espèces'}
                        </div>
                        {w.rib && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--batione-ink-500)', fontFamily: 'monospace' }}>
                            {w.rib.substring(0, 10)}…
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setWorkerAEditer(w);
                            setModalWorkerOuvert(true);
                          }}
                          className="bo-btn bo-btn--secondary"
                          style={{ minHeight: 32, padding: '0 10px', fontSize: 'var(--batione-font-size-xs)' }}
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ONGLET 2 : POINTAGE QUOTIDIEN DE CHANTIER                 */}
      {/* ========================================================= */}
      {tabActive === 'pointage' && (
        <div>
          {/* Barre de contrôle Date & Chantier */}
          <div
            className="bo-card"
            style={{
              marginBottom: 'var(--batione-space-4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--batione-space-3)',
            }}
          >
            {/* Contrôles Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-2)' }}>
              <button
                type="button"
                className="bo-btn bo-btn--secondary"
                onClick={() => changerJour(-1)}
                style={{ minHeight: 38, padding: '0 10px' }}
                title="Jour précédent"
              >
                <ChevronLeft size={18} />
              </button>

              <input
                type="date"
                className="bo-input"
                style={{ width: 170 }}
                value={datePointage}
                onChange={(e) => setDatePointage(e.target.value)}
              />

              <button
                type="button"
                className="bo-btn bo-btn--secondary"
                onClick={() => changerJour(1)}
                style={{ minHeight: 38, padding: '0 10px' }}
                title="Jour suivant"
              >
                <ChevronRight size={18} />
              </button>

              <button
                type="button"
                className="bo-btn bo-btn--secondary"
                style={{ minHeight: 38, fontSize: '0.8rem' }}
                onClick={() => setDatePointage(aujourdhuiStr)}
              >
                Aujourd’hui
              </button>
            </div>

            {/* Sélecteur de Chantier / Projet */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building size={16} color="var(--batione-ink-500)" />
                <span style={{ fontSize: 'var(--batione-font-size-sm)', fontWeight: 600 }}>Chantier :</span>
              </div>
              <select
                className="bo-input"
                style={{ width: 240 }}
                value={projetPointageId}
                onChange={(e) => setProjetPointageId(e.target.value)}
              >
                <option value="">Tous les chantiers / Global</option>
                {projets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Bouton Magique "Tout marquer présent" */}
            <button
              type="button"
              className="bo-btn bo-btn--secondary"
              onClick={toutMarquerPresent}
              style={{
                borderColor: 'var(--batione-primary)',
                color: 'var(--batione-primary-strong)',
                fontWeight: 700,
                backgroundColor: 'var(--batione-primary-soft)',
              }}
            >
              <Zap size={16} /> ⚡ Tout marquer Présent (8h)
            </button>
          </div>

          {/* Synthèse de la journée pointée */}
          {pointageJour && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 'var(--batione-space-3)',
                marginBottom: 'var(--batione-space-4)',
              }}
            >
              <div className="bo-card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--batione-success)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Présents</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--batione-success)' }}>
                  {pointageJour.presents} ouvriers
                </div>
              </div>

              <div className="bo-card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--batione-warning)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Demi-journées</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--batione-warning)' }}>
                  {pointageJour.demi_journees}
                </div>
              </div>

              <div className="bo-card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--batione-danger)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Absents</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--batione-danger)' }}>
                  {pointageJour.absents}
                </div>
              </div>

              <div className="bo-card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--batione-primary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Coût Main d’Œuvre Journée</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--batione-primary-strong)' }}>
                  {formatMAD(pointageJour.cout_total_journee_mad)}
                </div>
              </div>
            </div>
          )}

          {/* Grille de pointage réactive */}
          {!pointageJour ? (
            <div className="bo-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ color: 'var(--batione-ink-500)' }}>Chargement de la feuille de pointage…</p>
            </div>
          ) : pointageJour.lignes.length === 0 ? (
            <div className="bo-card bo-empty-state" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Users size={40} color="var(--batione-ink-300)" style={{ marginBottom: 12 }} />
              <h3>Aucun collaborateur actif disponible pour le pointage</h3>
              <p style={{ color: 'var(--batione-ink-500)' }}>
                Ajoutez d’abord des ouvriers dans l’onglet &laquo; Collaborateurs &raquo;.
              </p>
            </div>
          ) : (
            <div className="bo-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--batione-font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--batione-ink-100)', borderBottom: '1px solid var(--batione-ink-300)' }}>
                    <th style={{ padding: '12px 16px' }}>Collaborateur</th>
                    <th style={{ padding: '12px 16px' }}>Taux Journalier</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Présence Chantier</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Heures Sup</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Coût Jour (MAD)</th>
                  </tr>
                </thead>
                <tbody>
                  {pointageJour?.lignes.map((ligne) => (
                    <tr
                      key={ligne.worker_id}
                      style={{
                        borderBottom: '1px solid var(--batione-ink-100)',
                        backgroundColor:
                          ligne.statut_presence === StatutPresence.ABSENT
                            ? 'rgba(239, 68, 68, 0.03)'
                            : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--batione-ink-900)' }}>
                          {ligne.nom} {ligne.prenom}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>
                          {ligne.matricule} • {ligne.poste}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        {formatMAD(ligne.taux_journalier_mad)}
                      </td>

                      {/* Toggles de présence rapides */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', borderRadius: 8, padding: 3, backgroundColor: 'var(--batione-ink-100)', gap: 3 }}>
                          <button
                            type="button"
                            onClick={() => changerPresenceLigne(ligne.worker_id, StatutPresence.PRESENT)}
                            style={{
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              backgroundColor: ligne.statut_presence === StatutPresence.PRESENT ? 'var(--batione-success)' : 'transparent',
                              color: ligne.statut_presence === StatutPresence.PRESENT ? 'white' : 'var(--batione-ink-700)',
                              boxShadow: ligne.statut_presence === StatutPresence.PRESENT ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            }}
                          >
                            ✓ Présent (1j)
                          </button>

                          <button
                            type="button"
                            onClick={() => changerPresenceLigne(ligne.worker_id, StatutPresence.DEMI_JOURNEE)}
                            style={{
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              backgroundColor: ligne.statut_presence === StatutPresence.DEMI_JOURNEE ? 'var(--batione-warning)' : 'transparent',
                              color: ligne.statut_presence === StatutPresence.DEMI_JOURNEE ? 'white' : 'var(--batione-ink-700)',
                              boxShadow: ligne.statut_presence === StatutPresence.DEMI_JOURNEE ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            }}
                          >
                            ½ Demi-journée
                          </button>

                          <button
                            type="button"
                            onClick={() => changerPresenceLigne(ligne.worker_id, StatutPresence.ABSENT)}
                            style={{
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              backgroundColor: ligne.statut_presence === StatutPresence.ABSENT ? 'var(--batione-danger)' : 'transparent',
                              color: ligne.statut_presence === StatutPresence.ABSENT ? 'white' : 'var(--batione-ink-700)',
                              boxShadow: ligne.statut_presence === StatutPresence.ABSENT ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            }}
                          >
                            ✕ Absent
                          </button>
                        </div>
                      </td>

                      {/* Compteur d'heures sup */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className="bo-btn bo-btn--secondary"
                            onClick={() => modifierHeuresSupLigne(ligne.worker_id, -1)}
                            disabled={ligne.heures_sup <= 0}
                            style={{ minHeight: 28, width: 28, padding: 0 }}
                          >
                            -
                          </button>
                          <span style={{ fontWeight: 700, minWidth: 32, textAlign: 'center' }}>
                            {ligne.heures_sup} h
                          </span>
                          <button
                            type="button"
                            className="bo-btn bo-btn--secondary"
                            onClick={() => modifierHeuresSupLigne(ligne.worker_id, 1)}
                            style={{ minHeight: 28, width: 28, padding: 0 }}
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--batione-ink-900)' }}>
                        {formatMAD(ligne.cout_journee_mad)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ONGLET 3 : ACOMPTES SUR SALAIRE                           */}
      {/* ========================================================= */}
      {tabActive === 'acomptes' && (
        <div>
          {/* Header Acomptes */}
          <div
            className="bo-card"
            style={{
              marginBottom: 'var(--batione-space-4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--batione-space-3)',
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: 'var(--batione-ink-800)' }}>Filtre :</span>
              <label style={{ marginLeft: 12, cursor: 'pointer', fontSize: 'var(--batione-font-size-sm)' }}>
                <input
                  type="checkbox"
                  checked={filtreAcompteNonDeduit}
                  onChange={(e) => setFiltreAcompteNonDeduit(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                Afficher uniquement les acomptes en attente de déduction
              </label>
            </div>

            <button
              type="button"
              className="bo-btn bo-btn--primary"
              onClick={() => setModalAcompteOuvert(true)}
            >
              <Plus size={16} /> Enregistrer un acompte
            </button>
          </div>

          {(acomptes || []).length === 0 ? (
            <div className="bo-card bo-empty-state" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <DollarSign size={40} color="var(--batione-ink-300)" style={{ marginBottom: 12 }} />
              <h3>Aucun acompte enregistré</h3>
              <p style={{ color: 'var(--batione-ink-500)', marginBottom: 20 }}>
                Enregistrez les avances de trésorerie remises aux ouvriers sur chantier pour qu’elles soient déduites automatiquement lors du calcul de la paie.
              </p>
              <button
                type="button"
                className="bo-btn bo-btn--primary"
                onClick={() => setModalAcompteOuvert(true)}
              >
                <Plus size={16} /> Remettre le premier acompte
              </button>
            </div>
          ) : (
            <div className="bo-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--batione-font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--batione-ink-100)', borderBottom: '1px solid var(--batione-ink-300)' }}>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                    <th style={{ padding: '12px 16px' }}>Collaborateur</th>
                    <th style={{ padding: '12px 16px' }}>Montant Versé</th>
                    <th style={{ padding: '12px 16px' }}>Mode Paiement</th>
                    <th style={{ padding: '12px 16px' }}>Chantier</th>
                    <th style={{ padding: '12px 16px' }}>Motif</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Statut de Déduction</th>
                  </tr>
                </thead>
                <tbody>
                  {(acomptes || []).map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--batione-ink-100)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        {a.date_acompte.split('T')[0]}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600 }}>
                          {a.worker.nom} {a.worker.prenom}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>
                          {a.worker.matricule} • {a.worker.poste}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--batione-primary-strong)' }}>
                        {formatMAD(a.montant_mad)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{a.mode_paiement}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {a.project ? `${a.project.code} — ${a.project.nom}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--batione-ink-700)' }}>
                        {a.motif || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {a.deduit_paie ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 'var(--batione-radius-sm)',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            ✓ Déduit sur bulletin
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 'var(--batione-radius-sm)',
                              backgroundColor: '#fef3c7',
                              color: '#b45309',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            En attente de déduction
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ONGLET 4 : PAIE & BULLETINS MAROCAINS                     */}
      {/* ========================================================= */}
      {tabActive === 'paie' && (
        <div>
          {/* Sélecteur de mois & année + bouton générer */}
          <div
            className="bo-card"
            style={{
              marginBottom: 'var(--batione-space-4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--batione-space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-3)' }}>
              <select
                className="bo-input"
                style={{ width: 160 }}
                value={moisPaie}
                onChange={(e) => setMoisPaie(Number(e.target.value))}
              >
                {MOIS_FR.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                className="bo-input"
                style={{ width: 120 }}
                value={anneePaie}
                onChange={(e) => setAnneePaie(Number(e.target.value))}
              >
                {[2024, 2025, 2026, 2027].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="bo-btn bo-btn--primary"
              disabled={calculPaieEnCours}
              onClick={calculerPaieMois}
            >
              <Zap size={16} />
              {calculPaieEnCours ? 'Calcul en cours…' : 'Générer / Recalculer la paie du mois'}
            </button>
          </div>

          {/* Totaux & Synthèse du Mois */}
          {paieRecap && paieRecap.totaux && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--batione-space-3)',
                marginBottom: 'var(--batione-space-4)',
              }}
            >
              <div className="bo-card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--batione-ink-700)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Masse Brute (SBG)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {formatMAD(paieRecap.totaux.salaire_brut_total)}
                </div>
              </div>

              <div className="bo-card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--batione-danger)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Cotisations CNSS + AMO</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--batione-danger)' }}>
                  {formatMAD(paieRecap.totaux.cnss_salarie_total + paieRecap.totaux.amo_salarie_total)}
                </div>
              </div>

              <div className="bo-card" style={{ padding: '14px 18px', borderLeft: '4px solid #ea580c' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Impôt Retenu (IR Net)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ea580c' }}>
                  {formatMAD(paieRecap.totaux.ir_total)}
                </div>
              </div>

              <div className="bo-card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--batione-warning)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Acomptes Déduits</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--batione-warning)' }}>
                  {formatMAD(paieRecap.totaux.acomptes_total)}
                </div>
              </div>

              <div className="bo-card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--batione-success)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Net à Payer (Total)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--batione-success)' }}>
                  {formatMAD(paieRecap.totaux.salaire_net_total)}
                </div>
              </div>

              <div className="bo-card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--batione-primary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Coût Total Entreprise</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--batione-primary-strong)' }}>
                  {formatMAD(paieRecap.totaux.cout_employeur_total)}
                </div>
              </div>
            </div>
          )}

          {/* Tableau des bulletins */}
          {!paieRecap ? (
            <div className="bo-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ color: 'var(--batione-ink-500)' }}>Chargement des bulletins de paie…</p>
            </div>
          ) : (paieRecap.bulletins || []).length === 0 ? (
            <div className="bo-card bo-empty-state" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <FileSpreadsheet size={40} color="var(--batione-ink-300)" style={{ marginBottom: 12 }} />
              <h3>Aucun bulletin de paie généré pour ce mois</h3>
              <p style={{ color: 'var(--batione-ink-500)', marginBottom: 20 }}>
                Cliquez sur &laquo; Générer la paie du mois &raquo; pour compiler automatiquement les pointages réels et déduire les acomptes.
              </p>
              <button
                type="button"
                className="bo-btn bo-btn--primary"
                onClick={calculerPaieMois}
              >
                <Zap size={16} /> Générer la paie de {MOIS_FR[moisPaie - 1]} {anneePaie}
              </button>
            </div>
          ) : (
            <div className="bo-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--batione-font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--batione-ink-100)', borderBottom: '1px solid var(--batione-ink-300)' }}>
                    <th style={{ padding: '12px 16px' }}>Collaborateur</th>
                    <th style={{ padding: '12px 16px' }}>Jours / Heures</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Brut Global</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>CNSS + AMO</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>IR Net</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acomptes</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Net à Payer</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Statut</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(paieRecap.bulletins || []).map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--batione-ink-100)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600 }}>
                          {b.worker.nom} {b.worker.prenom}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>
                          {b.worker.matricule} • {b.worker.poste}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div>{Number(b.jours_travailles)} j</div>
                        {Number(b.heures_sup_heures) > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--batione-primary)' }}>
                            +{Number(b.heures_sup_heures)}h sup
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                        {formatMAD(b.salaire_brut_mad)}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--batione-danger)' }}>
                        {formatMAD(Number(b.cnss_salarie_mad) + Number(b.amo_salarie_mad))}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#ea580c' }}>
                        {formatMAD(b.ir_mad)}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--batione-warning)' }}>
                        {Number(b.acomptes_deduits_mad) > 0 ? `-${formatMAD(b.acomptes_deduits_mad)}` : '0,00 MAD'}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: 'var(--batione-success)' }}>
                        {formatMAD(b.salaire_net_mad)}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <StatutOperationnelBadge statut={b.statut} />
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="bo-btn bo-btn--secondary"
                          onClick={() => setBulletinSelectionne(b)}
                          style={{ minHeight: 30, padding: '0 10px', fontSize: '0.75rem' }}
                        >
                          <Eye size={14} /> Voir Bulletin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <WorkerModal
        ouvert={modalWorkerOuvert}
        workerExistant={workerAEditer}
        onFermer={() => {
          setModalWorkerOuvert(false);
          setWorkerAEditer(null);
        }}
        onSucces={() => {
          afficherAlerte('Collaborateur enregistré avec succès !');
          chargerWorkers();
        }}
      />

      <AcompteModal
        ouvert={modalAcompteOuvert}
        workers={workers.map((w) => ({
          id: w.id,
          matricule: w.matricule || '',
          nom: w.nom,
          prenom: w.prenom,
          poste: w.poste,
        }))}
        projects={projets}
        onFermer={() => setModalAcompteOuvert(false)}
        onSucces={() => {
          afficherAlerte('Acompte enregistré avec succès !');
          chargerAcomptes();
        }}
      />

      <BulletinPaieModal
        ouvert={Boolean(bulletinSelectionne)}
        bulletin={bulletinSelectionne}
        onFermer={() => setBulletinSelectionne(null)}
        onActionSucces={() => {
          afficherAlerte('Action sur le bulletin effectuée avec succès !');
          chargerPaie();
        }}
      />
    </div>
  );
}

export default function PageRhPaie() {
  return (
    <Suspense fallback={<p style={{ color: 'var(--batione-ink-500)', padding: 24 }}>Chargement du module RH…</p>}>
      <ContenuRhPaie />
    </Suspense>
  );
}
