export enum TypeContratWorker {
  CDI = 'CDI',
  CDD = 'CDD',
  JOURNALIER = 'JOURNALIER',
  TACHERON = 'TACHERON',
  ANAPEC = 'ANAPEC',
  STAGE = 'STAGE',
}

export enum StatutWorker {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  CONGE = 'CONGE',
  SUSPENDU = 'SUSPENDU',
}

export enum StatutPresence {
  PRESENT = 'PRESENT',
  DEMI_JOURNEE = 'DEMI_JOURNEE',
  ABSENT = 'ABSENT',
  CONGE_PAYE = 'CONGE_PAYE',
  CONGE_SANS_SOLDE = 'CONGE_SANS_SOLDE',
  MALADIE = 'MALADIE',
  ACCIDENT_TRAVAIL = 'ACCIDENT_TRAVAIL',
}

export const LIBELLE_TYPE_CONTRAT_WORKER: Record<TypeContratWorker, string> = {
  [TypeContratWorker.CDI]: 'CDI',
  [TypeContratWorker.CDD]: 'CDD',
  [TypeContratWorker.JOURNALIER]: 'Journalier',
  [TypeContratWorker.TACHERON]: 'Tâcheron',
  [TypeContratWorker.ANAPEC]: 'ANAPEC',
  [TypeContratWorker.STAGE]: 'Stage',
};

export const LIBELLE_STATUT_WORKER: Record<StatutWorker, string> = {
  [StatutWorker.ACTIF]: 'Actif',
  [StatutWorker.INACTIF]: 'Inactif',
  [StatutWorker.CONGE]: 'En congé',
  [StatutWorker.SUSPENDU]: 'Suspendu',
};

export const LIBELLE_STATUT_PRESENCE: Record<StatutPresence, string> = {
  [StatutPresence.PRESENT]: 'Présent (journée)',
  [StatutPresence.DEMI_JOURNEE]: 'Demi-journée (0.5j)',
  [StatutPresence.ABSENT]: 'Absent',
  [StatutPresence.CONGE_PAYE]: 'Congé payé',
  [StatutPresence.CONGE_SANS_SOLDE]: 'Sans solde',
  [StatutPresence.MALADIE]: 'Maladie',
  [StatutPresence.ACCIDENT_TRAVAIL]: 'Accident travail',
};

export const METIERS_BTP_MAROC = [
  'Maçon',
  'Coffreur',
  'Ferrailleur',
  'Chef de chantier',
  'Chef d’équipe',
  'Conducteur de travaux',
  'Conducteur d’engins',
  'Grutier',
  'Manœuvre spécialisé',
  'Manœuvre ordinaire',
  'Électricien',
  'Plombier / Tuyauteur',
  'Carreleur / Mosaïste',
  'Plâtrier / Staffeur',
  'Peintre bâtiment',
  'Menuisier bois/alu',
  'Échafaudeur',
  'Topographe / Géomètre',
  'Magasinier chantier',
  'Agent de sécurité',
  'Ingénieur travaux',
  'Administratif / RH',
  'Autre',
] as const;

export const BANQUES_MAROCAINES = [
  'Attijariwafa Bank',
  'Banque Populaire (BAM)',
  'Bank of Africa (BMCE)',
  'CIH Bank',
  'Société Générale Maroc',
  'Crédit du Maroc',
  'BMCI (BNP Paribas)',
  'Al Barid Bank',
  'Crédit Agricole du Maroc',
  'CFG Bank',
  'Umnia Bank',
  'Bank Assafa',
  'Autre',
] as const;
