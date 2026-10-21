import { useState } from 'react';
import { X, UserPlus, Save, AlertCircle } from 'lucide-react';
import {
  METIERS_BTP_MAROC,
  BANQUES_MAROCAINES,
  TypeContratWorker,
  StatutWorker,
  LIBELLE_TYPE_CONTRAT_WORKER,
} from '@batione/shared-types';
import { api } from '@/lib/api';

export interface WorkerData {
  id?: string;
  matricule?: string;
  nom: string;
  prenom: string;
  cin?: string | null;
  cnss_num?: string | null;
  telephone?: string | null;
  email?: string | null;
  poste: string;
  departement?: string | null;
  type_contrat: TypeContratWorker;
  statut?: StatutWorker;
  date_embauche?: string | null;
  date_fin_contrat?: string | null;
  salaire_base_mad: number | string;
  taux_journalier_mad: number | string;
  taux_horaire_mad: number | string;
  banque?: string | null;
  rib?: string | null;
  nombre_deductions_ir: number;
  adresse?: string | null;
  ville?: string | null;
  contact_urgence_nom?: string | null;
  contact_urgence_tel?: string | null;
  notes?: string | null;
}

interface WorkerModalProps {
  ouvert: boolean;
  workerExistant?: WorkerData | null;
  onFermer: () => void;
  onSucces: () => void;
}

export function WorkerModal({ ouvert, workerExistant, onFermer, onSucces }: WorkerModalProps) {
  const [nom, setNom] = useState(workerExistant?.nom ?? '');
  const [prenom, setPrenom] = useState(workerExistant?.prenom ?? '');
  const [cin, setCin] = useState(workerExistant?.cin ?? '');
  const [cnssNum, setCnssNum] = useState(workerExistant?.cnss_num ?? '');
  const [telephone, setTelephone] = useState(workerExistant?.telephone ?? '');
  const [email, setEmail] = useState(workerExistant?.email ?? '');
  const [poste, setPoste] = useState(workerExistant?.poste ?? 'Maçon');
  const [departement, setDepartement] = useState(workerExistant?.departement ?? 'Chantier');
  const [typeContrat, setTypeContrat] = useState<TypeContratWorker>(
    workerExistant?.type_contrat ?? TypeContratWorker.JOURNALIER
  );
  const [tauxJournalier, setTauxJournalier] = useState(
    workerExistant ? String(workerExistant.taux_journalier_mad) : '180'
  );
  const [salaireBase, setSalaireBase] = useState(
    workerExistant ? String(workerExistant.salaire_base_mad) : '0'
  );
  const [tauxHoraire, setTauxHoraire] = useState(
    workerExistant ? String(workerExistant.taux_horaire_mad) : '0'
  );
  const [banque, setBanque] = useState(workerExistant?.banque ?? 'Attijariwafa Bank');
  const [rib, setRib] = useState(workerExistant?.rib ?? '');
  const [nombreDeductionsIr, setNombreDeductionsIr] = useState(
    workerExistant?.nombre_deductions_ir ?? 0
  );
  const [ville, setVille] = useState(workerExistant?.ville ?? 'Casablanca');
  const [contactUrgenceNom, setContactUrgenceNom] = useState(
    workerExistant?.contact_urgence_nom ?? ''
  );
  const [contactUrgenceTel, setContactUrgenceTel] = useState(
    workerExistant?.contact_urgence_tel ?? ''
  );
  const [notes, setNotes] = useState(workerExistant?.notes ?? '');

  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!ouvert) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    try {
      const payload = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        cin: cin.trim() ? cin.trim().toUpperCase() : undefined,
        cnss_num: cnssNum.trim() || undefined,
        telephone: telephone.trim() || undefined,
        email: email.trim() || undefined,
        poste: poste.trim(),
        departement: departement.trim() || undefined,
        type_contrat: typeContrat,
        taux_journalier_mad: Number(tauxJournalier) || 0,
        salaire_base_mad: Number(salaireBase) || 0,
        taux_horaire_mad: Number(tauxHoraire) || 0,
        banque: banque.trim() || undefined,
        rib: rib.trim() || undefined,
        nombre_deductions_ir: Number(nombreDeductionsIr) || 0,
        ville: ville.trim() || undefined,
        contact_urgence_nom: contactUrgenceNom.trim() || undefined,
        contact_urgence_tel: contactUrgenceTel.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (workerExistant?.id) {
        await api.patch(`/workers/${workerExistant.id}`, payload);
      } else {
        await api.post('/workers', payload);
      }

      onSucces();
      onFermer();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErreur(err.message);
      } else {
        setErreur('Une erreur est survenue lors de l’enregistrement.');
      }
    } finally {
      setChargement(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: 'var(--batione-space-4)',
      }}
    >
      <div
        className="bo-card"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 'var(--batione-space-6)',
          borderRadius: 'var(--batione-radius-lg)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--batione-space-5)',
            borderBottom: '1px solid var(--batione-ink-100)',
            paddingBottom: 'var(--batione-space-4)',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 'var(--batione-font-size-xl)',
                color: 'var(--batione-ink-900)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--batione-space-2)',
              }}
            >
              <UserPlus size={22} color="var(--batione-primary)" />
              {workerExistant ? 'Modifier le collaborateur' : 'Nouveau collaborateur / Ouvrier'}
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--batione-ink-500)', fontSize: 'var(--batione-font-size-sm)' }}>
              Fiche travailleur conforme au marché marocain (CIN, CNSS, BTP, Taux MAD).
            </p>
          </div>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--batione-space-4)' }}>
          {/* Section 1 : État Civil & Identité Marocaine */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--batione-space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                Nom <span style={{ color: 'var(--batione-danger)' }}>*</span>
              </label>
              <input
                className="bo-input"
                required
                placeholder="ex. Tahiri"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                Prénom <span style={{ color: 'var(--batione-danger)' }}>*</span>
              </label>
              <input
                className="bo-input"
                required
                placeholder="ex. Youssef"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--batione-space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                CIN Marocaine
              </label>
              <input
                className="bo-input"
                placeholder="ex. AB123456"
                value={cin}
                onChange={(e) => setCin(e.target.value.toUpperCase())}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>Carte Nationale d’Identité</span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                N° CNSS
              </label>
              <input
                className="bo-input"
                placeholder="ex. 123456789"
                value={cnssNum}
                onChange={(e) => setCnssNum(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--batione-ink-500)' }}>9 chiffres d’immatriculation</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--batione-space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                Téléphone
              </label>
              <input
                className="bo-input"
                placeholder="ex. 06 61 23 45 67"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                Email (optionnel)
              </label>
              <input
                type="email"
                className="bo-input"
                placeholder="ex. y.tahiri@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--batione-space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                Ville de rattachement
              </label>
              <input
                className="bo-input"
                placeholder="ex. Casablanca, Tanger, Marrakech..."
                value={ville}
                onChange={(e) => setVille(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                Département / Affectation
              </label>
              <input
                className="bo-input"
                placeholder="ex. Chantier Gros Œuvre, Finitions..."
                value={departement}
                onChange={(e) => setDepartement(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2 : Métier & Contrat */}
          <div style={{ borderTop: '1px solid var(--batione-ink-100)', paddingTop: 'var(--batione-space-4)' }}>
            <h3 style={{ fontSize: 'var(--batione-font-size-sm)', color: 'var(--batione-primary)', margin: '0 0 var(--batione-space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Métier & Modalités de Contrat
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--batione-space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                  Poste / Spécialité <span style={{ color: 'var(--batione-danger)' }}>*</span>
                </label>
                <input
                  list="metiers-btp-list"
                  className="bo-input"
                  required
                  placeholder="Sélectionner ou saisir..."
                  value={poste}
                  onChange={(e) => setPoste(e.target.value)}
                />
                <datalist id="metiers-btp-list">
                  {METIERS_BTP_MAROC.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                  Type de contrat
                </label>
                <select
                  className="bo-input"
                  value={typeContrat}
                  onChange={(e) => setTypeContrat(e.target.value as TypeContratWorker)}
                >
                  {Object.values(TypeContratWorker).map((t) => (
                    <option key={t} value={t}>
                      {LIBELLE_TYPE_CONTRAT_WORKER[t]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3 : Rémunération en MAD */}
          <div style={{ borderTop: '1px solid var(--batione-ink-100)', paddingTop: 'var(--batione-space-4)' }}>
            <h3 style={{ fontSize: 'var(--batione-font-size-sm)', color: 'var(--batione-primary)', margin: '0 0 var(--batione-space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rémunération & Coûts de Chantier (MAD)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--batione-space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                  Taux Journalier (MAD)
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="bo-input"
                  placeholder="ex. 180"
                  value={tauxJournalier}
                  onChange={(e) => setTauxJournalier(e.target.value)}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--batione-ink-500)' }}>Pour ouvriers journaliers BTP</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                  Salaire Mensuel Base (MAD)
                </label>
                <input
                  type="number"
                  step="100"
                  className="bo-input"
                  placeholder="ex. 4500"
                  value={salaireBase}
                  onChange={(e) => setSalaireBase(e.target.value)}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--batione-ink-500)' }}>Pour CDI / CDD mensuels</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                  Taux Horaire (MAD)
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="bo-input"
                  placeholder="ex. 22.5"
                  value={tauxHoraire}
                  onChange={(e) => setTauxHoraire(e.target.value)}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--batione-ink-500)' }}>Base calcul heures sup (x1.25)</span>
              </div>
            </div>
          </div>

          {/* Section 4 : Données Bancaires & IR */}
          <div style={{ borderTop: '1px solid var(--batione-ink-100)', paddingTop: 'var(--batione-space-4)' }}>
            <h3 style={{ fontSize: 'var(--batione-font-size-sm)', color: 'var(--batione-primary)', margin: '0 0 var(--batione-space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Banque & Charges de Famille (IR Maroc)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--batione-space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                  Banque
                </label>
                <select
                  className="bo-input"
                  value={banque}
                  onChange={(e) => setBanque(e.target.value)}
                >
                  {BANQUES_MAROCAINES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                  Déductions Famille (IR)
                </label>
                <input
                  type="number"
                  min="0"
                  max="6"
                  className="bo-input"
                  value={nombreDeductionsIr}
                  onChange={(e) => setNombreDeductionsIr(Number(e.target.value))}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--batione-ink-500)' }}>Enfants/épouse (30 MAD/pers, max 6)</span>
              </div>
            </div>

            <div style={{ marginTop: 'var(--batione-space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                RIB Bancaire (24 chiffres)
              </label>
              <input
                className="bo-input"
                placeholder="ex. 007780000123456789012345"
                maxLength={24}
                value={rib}
                onChange={(e) => setRib(e.target.value.replace(/\s+/g, ''))}
              />
            </div>
          </div>

          {/* Section 5 : Contact d'urgence */}
          <div style={{ borderTop: '1px solid var(--batione-ink-100)', paddingTop: 'var(--batione-space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--batione-space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                  Contact Urgence (Nom)
                </label>
                <input
                  className="bo-input"
                  placeholder="ex. Épouse / Frère"
                  value={contactUrgenceNom}
                  onChange={(e) => setContactUrgenceNom(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                  Téléphone Urgence
                </label>
                <input
                  className="bo-input"
                  placeholder="ex. 06 00 00 00 00"
                  value={contactUrgenceTel}
                  onChange={(e) => setContactUrgenceTel(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 'var(--batione-space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
                Observations & Notes
              </label>
              <textarea
                className="bo-input"
                style={{ minHeight: 60, padding: '8px 12px' }}
                placeholder="Remarques particulières, qualifications supplémentaires..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--batione-space-3)',
              marginTop: 'var(--batione-space-4)',
              borderTop: '1px solid var(--batione-ink-100)',
              paddingTop: 'var(--batione-space-4)',
            }}
          >
            <button
              type="button"
              className="bo-btn bo-btn--secondary"
              onClick={onFermer}
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bo-btn bo-btn--primary"
              disabled={chargement}
            >
              <Save size={16} />
              {chargement ? 'Enregistrement…' : workerExistant ? 'Mettre à jour' : 'Créer le collaborateur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
