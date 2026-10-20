/** Enveloppe de réponse API standard — cf. API_CONTRACTS.md §1.2/1.3. */
export interface ApiMetadonnees {
  page?: number;
  limite?: number;
  total?: number;
  total_pages?: number;
}

export interface ApiSuccess<T> {
  succes: true;
  donnees: T;
  metadonnees?: ApiMetadonnees;
}

export interface ApiErreurChamp {
  champ: string;
  regle: string;
  valeur_actuelle?: unknown;
  valeur_demandee?: unknown;
}

export interface ApiErreur {
  succes: false;
  erreur: {
    code: string;
    message: string;
    champs?: ApiErreurChamp[];
    horodatage: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErreur;

/** Codes d'erreur normalisés utilisés par l'API (cf. AGENTS.md / API_CONTRACTS.md). */
export enum CodeErreurApi {
  TENANT_HEADER_NOT_ALLOWED = 'TENANT_HEADER_NOT_ALLOWED',
  STOCK_INSUFFISANT = 'STOCK_INSUFFISANT',
  STATUT_INVALIDE_POUR_EXTOURNE = 'STATUT_INVALIDE_POUR_EXTOURNE',
  DEJA_EXTOURNE = 'DEJA_EXTOURNE',
  EXTOURNE_BLOQUEE_DECOMPTE_ULTERIEUR = 'EXTOURNE_BLOQUEE_DECOMPTE_ULTERIEUR',
  IDEMPOTENCY_KEY_CONFLICT = 'IDEMPOTENCY_KEY_CONFLICT',
  IDENTIFIANTS_INVALIDES = 'IDENTIFIANTS_INVALIDES',
  COMPTE_DESACTIVE = 'COMPTE_DESACTIVE',
  JETON_INVALIDE = 'JETON_INVALIDE',
  ACCES_REFUSE = 'ACCES_REFUSE',
  RESSOURCE_INTROUVABLE = 'RESSOURCE_INTROUVABLE',
  VALIDATION_ECHOUEE = 'VALIDATION_ECHOUEE',
}
