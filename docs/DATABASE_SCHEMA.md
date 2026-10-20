# DATABASE_SCHEMA.md — Schéma de Données Relationnel & Modèle Prisma

> **Statut de ce document** : spécification de schéma approuvée (Gate 0, décisions D1–D12, D14). Le code Prisma ci-dessous n'a pas été appliqué à une base réelle ni migré — c'est une cible de conception, pas une implémentation vérifiée. Toute mention de contrainte nécessitant du SQL brut (hors syntaxe `schema.prisma` déclarative standard) est signalée explicitement.

## 1. Principes & Conventions de Modélisation
- **Prisma & PostgreSQL** : Définition formelle sous forme de modèle `schema.prisma`.
- **Typage Monétaire Strict** : Les montants financiers sont modélisés exclusivement en `Decimal(14, 2)`. Les centimes entiers sont explicitement écartés — aucune ambiguïté résiduelle (cf. ADR-007, AGENTS.md §5). Aucune conformité comptable statutaire n'est revendiquée par ce typage ; il garantit uniquement l'exactitude arithmétique opérationnelle.
- **Invariant de Stock Non-Négatif (Décision D8)** : La table `StockMagasin` doit porter une contrainte `CHECK (quantite_disponible >= 0)`. Cette contrainte **n'est pas exprimable dans la syntaxe déclarative standard de ce schéma Prisma** et doit être ajoutée via une migration SQL manuelle (`ALTER TABLE ... ADD CONSTRAINT ... CHECK (...)`), documentée explicitement dans le fichier de migration correspondant — ne pas supposer qu'elle est générée automatiquement par `prisma migrate dev`. La décrémentation applicative suit un motif de mise à jour conditionnelle atomique (cf. `ARCHITECTURE.md` §4.2), pas un verrou pessimiste explicite.
- **Pas de réservation de stock en v1 (Décision D9)** : aucun champ `quantite_reservee` n'existe dans ce schéma. La disponibilité se lit directement sur `quantite_disponible`.
- **Traçabilité & Extourne** : Les entités sensibles disposent d'un statut opérationnel (`BROUILLON`, `SOUMIS`, `APPROUVE`, `ENREGISTRE`, `EXTOURNE`) et d'un champ d'auto-référence `extourne_de_id`. Ce champ porte une contrainte d'unicité partielle (`WHERE extourne_de_id IS NOT NULL`) sur chaque modèle qui le porte — également hors syntaxe déclarative standard de Prisma pour une unicité partielle, donc à ajouter via migration SQL manuelle (`CREATE UNIQUE INDEX ... WHERE extourne_de_id IS NOT NULL`).
- **Isolation Multi-Tenant (Décision D10)** : chaque table listée ci-dessous porte `organization_id`. Cette colonne est la base de la couche applicative ET de la politique PostgreSQL Row-Level Security prévue en défense en profondeur (cf. `ARCHITECTURE.md` §4.1) — l'activation effective des policies RLS reste un livrable d'implémentation distinct.
- **Idempotence (voir `ARCHITECTURE.md` §6)** : `BonSortie`, `Pointage`, `Depense`, `AcompteOuvrier` portent un champ `idempotency_key` avec contrainte d'unicité `(organization_id, idempotency_key)`.

---

## 2. Définition Complète du Schéma Prisma (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// -------------------------------------------------------------
// ENUMS COMMUNS & ÉTATS OPÉRATIONNELS
// -------------------------------------------------------------

enum RoleUtilisateur {
  SUPERADMIN             // Administration plateforme (hors organisation cliente)
  ORG_ADMIN              // Propriétaire / Directeur Général
  GESTIONNAIRE           // Manager générique (ADR-009)
  CONDUCTEUR_TRAVAUX     // Chef de projet travaux
  CHEF_CHANTIER          // Responsable terrain
  DAF_COMPTABLE          // Responsable financier
  RH_PAIE                // Responsable RH & Paie (ADR-009)
  MAGASINIER             // Gestionnaire des stocks et dépôts
  GESTIONNAIRE_MATERIEL  // Gestionnaire parc matériel/équipement (ADR-009)
  EMPLOYE                // Employé/Ouvrier — accès self-service (ADR-009)
  LECTEUR                // Lecture seule (ADR-009)
}

enum StatutOperationnel {
  BROUILLON              // Draft
  SOUMIS                 // Submitted
  APPROUVE               // Approved
  ENREGISTRE             // Recorded (Scellé et immuable)
  EXTOURNE               // Reversal (Contre-passation d'un enregistrement annulé)
}

enum StatutChantier {
  ETUDE
  EN_COURS
  RECEPTION_PROVISOIRE
  RECEPTION_DEFINITIVE
  CLOTURE
  SUSPENDU
}

enum TypeTiers {
  CLIENT_MAITRE_OUVRAGE
  MAITRE_OEUVRE_ARCHITECTE
  BUREAU_ETUDES_BET
  BUREAU_CONTROLE
  FOURNISSEUR
  SOUS_TRAITANT
}

enum CategorieDepense {
  MATERIAUX
  MAIN_D_OEUVRE
  MATERIEL_ENGINS
  SOUS_TRAITANCE
  FRAIS_GENERAUX_CHANTIER
}

enum TypeMouvementStock {
  ENTREE_FOURNISSEUR     // Réception Bon de Livraison (BL)
  SORTIE_CHANTIER        // Consommation sur chantier (Bon de Sortie)
  TRANSFERT_INTER_DEPOT  // Déplacement entre dépôts
  RETOUR_CHANTIER        // Réintégration surplus de chantier
  EXTOURNE_MOUVEMENT     // Annulation contrôlée
}

enum TypeContratOuvrier {
  PERMANENT_MENSUEL
  JOURNALIER
  TACHERON
}

// -------------------------------------------------------------
// MODULE 1 : ORGANISATION & UTILISATEURS (MULTI-TENANCY)
// -------------------------------------------------------------

model Organization {
  id                    String                 @id @default(uuid())
  nom                   String
  ice                   String                 @unique // Identifiant Commun de l'Entreprise
  rc                    String?                // Registre de Commerce
  if_num                String?                // Identifiant Fiscal
  patente               String?
  cnss_employeur        String?                // Numéro d'affiliation CNSS employeur (ADR-009)
  secteur_activite       String?                // 'CONSTRUCTION', 'EVENEMENTIEL', 'AGENCE', 'SERVICES', 'NEGOCE', 'AUTRE' (ADR-009)
  adresse               String?
  ville                 String                 @default("Casablanca")
  telephone             String?
  email                 String?
  devise                String                 @default("MAD")
  langue_defaut         String                 @default("fr")        // 'fr', 'ar', 'en' (ADR-009)
  logo_url              String?
  rib                   String?                // RIB bancaire principal (ADR-009)
  banque                String?
  numerotation_devis    String                 @default("DEV-{YYYY}-{SEQ:4}")   // gabarit de numérotation (ADR-009)
  numerotation_facture  String                 @default("FAC-{YYYY}-{SEQ:4}")
  payroll_config_validated_at DateTime?        // Non nul seulement après validation explicite par le comptable de l'organisation (cf. PRODUCT_SPEC.md §7)
  onboarding_complete   Boolean                @default(false)
  created_at            DateTime               @default(now())
  updated_at            DateTime               @updatedAt

  users                 User[]
  chantiers             Chantier[]
  tiers                 Tiers[]
  clients               Client[]
  articles              Article[]
  magasins              Magasin[]
  ouvriers              Ouvrier[]
  workers               Worker[]
  engins                Engin[]
  equipments            Equipment[]
  quotations            Quotation[]
  invoices              Invoice[]
  payrollRules          PayrollRule[]
  payrollPeriods        PayrollPeriod[]
  expenseCategories     ExpenseCategory[]
  documentTemplates     DocumentTemplate[]
  notifications         Notification[]
  settings              Setting[]
  ecrituresConsolidees  EcritureConsolidee[]
  pistesAudit           PisteAudit[]
}

model User {
  id                    String                 @id @default(uuid())
  organization_id       String
  nom                   String
  prenom                String
  email                 String                 @unique
  password_hash         String
  role                  RoleUtilisateur        @default(CHEF_CHANTIER)
  telephone             String?
  cin                   String?                // Carte d'Identité Nationale
  langue_preferee       String                 @default("fr")        // 'fr', 'ar', 'en' (ADR-009)
  worker_id             String?                @unique                // Lien optionnel vers sa fiche Worker si role = EMPLOYE (ADR-009)
  actif                 Boolean                @default(true)
  created_at            DateTime               @default(now())
  updated_at            DateTime               @updatedAt

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  chantiersConducteur   Chantier[]             @relation("ConducteurChantier")
  chantiersChef         Chantier[]             @relation("ChefChantier")
  actionsAudit          PisteAudit[]

  @@index([organization_id, role])
}

// -------------------------------------------------------------
// MODULE 2 : PROJETS, CHANTIERS & JOURNAL DE CHANTIER
// -------------------------------------------------------------

model Chantier {
  id                    String                 @id @default(uuid())
  organization_id       String
  code_chantier         String                 // ex: 'CH-2026-001'
  nom                   String
  client_id             String?
  conducteur_id         String?
  chef_chantier_id      String?
  statut                StatutChantier         @default(ETUDE)
  adresse               String?
  ville                 String                 @default("Casablanca")
  date_demarrage        DateTime?
  date_fin_prevue       DateTime?
  date_fin_reelle       DateTime?
  montant_marche_ht     Decimal                @default(0.00) @db.Decimal(14, 2)
  taux_tva              Decimal                @default(20.00) @db.Decimal(5, 2)
  taux_retenue_garantie Decimal                @default(10.00) @db.Decimal(5, 2)
  created_at            DateTime               @default(now())
  updated_at            DateTime               @updatedAt

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  client                Tiers?                 @relation(fields: [client_id], references: [id])
  conducteur            User?                  @relation("ConducteurChantier", fields: [conducteur_id], references: [id])
  chefChantier          User?                  @relation("ChefChantier", fields: [chef_chantier_id], references: [id])

  lots                  LotTravaux[]
  journaux              JournalChantier[]
  devis                 Devis[]
  decomptes             Decompte[]
  depenses              Depense[]
  bonsCommande          BonCommande[]
  bonsSortie            BonSortie[]
  pointages             Pointage[]
  affectationsEngins    AffectationEngin[]
  ecritures             EcritureConsolidee[]

  @@unique([organization_id, code_chantier])
  @@index([organization_id, statut])
}

model LotTravaux {
  id                    String                 @id @default(uuid())
  organization_id       String
  chantier_id           String
  code_lot              String                 // ex: 'LOT-01'
  designation           String                 // ex: 'Gros Œuvre'
  budget_prevu_ht       Decimal                @default(0.00) @db.Decimal(14, 2)

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  chantier              Chantier               @relation(fields: [chantier_id], references: [id], onDelete: Cascade)
  taches                TacheChantier[]

  @@index([organization_id, chantier_id])
}

model TacheChantier {
  id                    String                 @id @default(uuid())
  organization_id       String
  lot_id                String
  designation           String
  avancement_pourcent   Int                    @default(0)
  date_debut            DateTime?
  date_fin              DateTime?

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  lot                   LotTravaux             @relation(fields: [lot_id], references: [id], onDelete: Cascade)

  @@index([organization_id, lot_id])
}

model JournalChantier {
  id                    String                 @id @default(uuid())
  organization_id       String
  chantier_id           String
  date_journal          DateTime               @db.Date
  meteo                 String?                // 'Ensoleillé', 'Pluie', 'Vent fort'
  temperature           Int?
  effectif_present      Int                    @default(0)
  travaux_realises      String                 @db.Text
  incidents_securite    String?                @db.Text
  visites_chantier      String?                @db.Text
  photos                PhotoChantier[]
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  chantier              Chantier               @relation(fields: [chantier_id], references: [id], onDelete: Cascade)

  @@unique([chantier_id, date_journal])
  @@index([organization_id])
}

model PhotoChantier {
  id                    String                 @id @default(uuid())
  organization_id       String
  journal_id            String
  url                   String
  description           String?
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  journal               JournalChantier        @relation(fields: [journal_id], references: [id], onDelete: Cascade)

  @@index([organization_id, journal_id])
}

// -------------------------------------------------------------
// MODULE 3 & 4 : CLIENTS, MARCHÉS, DEVIS & DÉCOMPTES
// -------------------------------------------------------------

model Tiers {
  id                    String                 @id @default(uuid())
  organization_id       String
  type_tiers            TypeTiers
  raison_sociale        String
  ice                   String?                // ICE marocain
  rc                    String?
  if_num                String?
  adresse               String?
  ville                 String?
  telephone             String?
  email                 String?
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  chantiersClient       Chantier[]
  fournisseurBC         BonCommande[]
  depensesTiers         Depense[]

  @@index([organization_id, type_tiers])
}

model Devis {
  id                    String                 @id @default(uuid())
  organization_id       String
  chantier_id           String
  reference             String                 // 'DEV-2026-001'
  objet                 String
  total_ht              Decimal                @default(0.00) @db.Decimal(14, 2)
  total_tva             Decimal                @default(0.00) @db.Decimal(14, 2)
  total_ttc             Decimal                @default(0.00) @db.Decimal(14, 2)
  statut                StatutOperationnel     @default(BROUILLON)
  date_emission         DateTime               @db.Date
  created_at            DateTime               @default(now())

  chantier              Chantier               @relation(fields: [chantier_id], references: [id], onDelete: Cascade)
  lignes                DevisLigne[]
}

model DevisLigne {
  id                    String                 @id @default(uuid())
  organization_id       String
  devis_id              String
  numero_prix           String                 // '1.01'
  designation           String
  unite                 String                 // 'm²', 'm³', 'ml', 'kg', 'u', 'forfait'
  quantite              Decimal                @db.Decimal(12, 3)
  prix_unitaire_ht      Decimal                @db.Decimal(14, 2)
  taux_tva              Decimal                @default(20.00) @db.Decimal(5, 2)
  total_ligne_ht        Decimal                @db.Decimal(14, 2)

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  devis                 Devis                  @relation(fields: [devis_id], references: [id], onDelete: Cascade)
  lignesDecompte        DecompteLigne[]

  @@index([organization_id, devis_id])
}

model Decompte {
  id                    String                 @id @default(uuid())
  organization_id       String
  chantier_id           String
  numero_decompte       Int                    // Décompte N° 1, 2, 3... — ordre de dépendance pour l'extourne (cf. ARCHITECTURE.md §4.3)
  type_decompte         String                 @default("PROVISOIRE") // 'PROVISOIRE', 'DEFINITIF', 'LEVEE_RETENUE' (cf. Décision D7)
  periode_debut         DateTime               @db.Date
  periode_fin           DateTime               @db.Date
  cumul_precedent_ht    Decimal                @default(0.00) @db.Decimal(14, 2)
  cumul_mois_ht         Decimal                @default(0.00) @db.Decimal(14, 2)
  cumul_total_ht        Decimal                @default(0.00) @db.Decimal(14, 2)
  retenue_garantie_ht   Decimal                @default(0.00) @db.Decimal(14, 2)
  retenue_garantie_levee_ht Decimal            @default(0.00) @db.Decimal(14, 2) // Cumul des montants déjà libérés via décomptes LEVEE_RETENUE
  montant_net_ht        Decimal                @default(0.00) @db.Decimal(14, 2)
  montant_tva           Decimal                @default(0.00) @db.Decimal(14, 2) // Somme des montant_tva_ligne de DecompteLigne (cf. §Précision & Arrondi)
  montant_net_ttc       Decimal                @default(0.00) @db.Decimal(14, 2)
  statut                StatutOperationnel     @default(BROUILLON)
  extourne_de_id        String?                // Référence si extourne — unique partiel (WHERE NOT NULL), migration SQL manuelle requise
  piece_jointe_pv_url   String?                // PV de réception/levée de retenue justifiant un LEVEE_RETENUE (Décision D7)
  date_validation       DateTime?
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  chantier              Chantier               @relation(fields: [chantier_id], references: [id], onDelete: Cascade)
  lignes                DecompteLigne[]

  @@unique([chantier_id, numero_decompte])
}

model DecompteLigne {
  // Décision D3 : snapshot historique immuable — ces valeurs sont copiées au moment de la génération
  // du décompte et ne sont JAMAIS recalculées si la DevisLigne source est modifiée ultérieurement.
  id                        String             @id @default(uuid())
  organization_id           String
  decompte_id               String
  devis_ligne_id             String
  numero_prix               String             // snapshot de DevisLigne.numero_prix
  designation                String             // snapshot
  unite                      String             // snapshot
  quantite_cumulee_precedente Decimal           @default(0.00) @db.Decimal(12, 3)
  quantite_cumulee_actuelle  Decimal            @default(0.00) @db.Decimal(12, 3)
  quantite_mois              Decimal            @default(0.00) @db.Decimal(12, 3)
  prix_unitaire_ht           Decimal            @db.Decimal(14, 2) // snapshot — jamais relu depuis DevisLigne après génération
  taux_tva                   Decimal            @db.Decimal(5, 2)  // snapshot — permet les taux mixtes 20%/14% sur un même décompte
  montant_ligne_ht           Decimal            @default(0.00) @db.Decimal(14, 2)
  montant_tva_ligne          Decimal            @default(0.00) @db.Decimal(14, 2)

  organization               Organization       @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  decompte                   Decompte           @relation(fields: [decompte_id], references: [id], onDelete: Cascade)
  devisLigne                 DevisLigne         @relation(fields: [devis_ligne_id], references: [id])

  @@index([organization_id, decompte_id])
}

// -------------------------------------------------------------
// MODULE 5 : STOCKS, ARTICLES & APPROVISIONNEMENTS
// -------------------------------------------------------------

model Article {
  id                    String                 @id @default(uuid())
  organization_id       String
  code_article          String                 // ex: 'CIM-CPJ45'
  designation           String                 // 'Ciment CPJ 45 sac 50kg'
  categorie             String                 // 'Liants', 'Aciers', 'Agrégats', 'EPI'
  unite_mesure          String                 // 'sac', 'kg', 'tonne', 'm³', 'u'
  prix_moyen_pondere_ht Decimal                @default(0.00) @db.Decimal(14, 2)
  seuil_alerte_global   Decimal                @default(0.00) @db.Decimal(12, 3)
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  stocksMagasins        StockMagasin[]
  lignesBC              BonCommandeLigne[]
  lignesBL              BonLivraisonLigne[]
  lignesBS              BonSortieLigne[]
  mouvements            MouvementStock[]

  @@unique([organization_id, code_article])
}

model Magasin {
  id                    String                 @id @default(uuid())
  organization_id       String
  nom                   String                 // 'Dépôt Central Casablanca', 'Magasin Chantier Marina'
  est_chantier          Boolean                @default(false)
  chantier_id           String?
  adresse               String?

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  stocks                StockMagasin[]
  bonsSortieSource      BonSortie[]
}

model StockMagasin {
  // Décision D9 : pas de champ de réservation en v1 — la disponibilité se lit directement ici.
  // Décision D8 : quantite_disponible >= 0 imposé par CHECK en base (migration SQL manuelle,
  // hors syntaxe déclarative Prisma standard) ET par mise à jour conditionnelle atomique côté
  // application (cf. ARCHITECTURE.md §4.2). Aucun verrou explicite FOR UPDATE n'est utilisé.
  id                    String                 @id @default(uuid())
  organization_id       String
  magasin_id            String
  article_id            String
  quantite_disponible   Decimal                @default(0.00) @db.Decimal(12, 3)
  updated_at            DateTime               @updatedAt

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  magasin               Magasin                @relation(fields: [magasin_id], references: [id], onDelete: Cascade)
  article               Article                @relation(fields: [article_id], references: [id], onDelete: Cascade)

  @@unique([organization_id, magasin_id, article_id])
}

model BonCommande {
  id                    String                 @id @default(uuid())
  organization_id       String
  chantier_id           String
  fournisseur_id        String
  numero_bc             String                 // 'BC-2026-0042'
  total_ht              Decimal                @default(0.00) @db.Decimal(14, 2)
  statut                StatutOperationnel     @default(BROUILLON)
  date_commande         DateTime               @db.Date

  chantier              Chantier               @relation(fields: [chantier_id], references: [id], onDelete: Cascade)
  fournisseur           Tiers                  @relation(fields: [fournisseur_id], references: [id])
  lignes                BonCommandeLigne[]
  bonsLivraison         BonLivraison[]
}

model BonCommandeLigne {
  id                    String                 @id @default(uuid())
  bon_commande_id       String
  article_id            String
  quantite_commandee    Decimal                @db.Decimal(12, 3)
  prix_unitaire_ht      Decimal                @db.Decimal(14, 2)
  total_ligne_ht        Decimal                @db.Decimal(14, 2)

  bonCommande           BonCommande            @relation(fields: [bon_commande_id], references: [id], onDelete: Cascade)
  article               Article                @relation(fields: [article_id], references: [id])
}

model BonLivraison {
  id                    String                 @id @default(uuid())
  organization_id       String
  bon_commande_id       String
  numero_bl_fournisseur String                 // Numéro inscrit sur le papier fournisseur
  photo_bl_url          String?
  statut                StatutOperationnel     @default(BROUILLON)
  date_reception        DateTime               @db.Date
  receptionne_par_id    String?

  bonCommande           BonCommande            @relation(fields: [bon_commande_id], references: [id], onDelete: Cascade)
  lignes                BonLivraisonLigne[]
}

model BonLivraisonLigne {
  id                    String                 @id @default(uuid())
  bon_livraison_id      String
  article_id            String
  quantite_livree       Decimal                @db.Decimal(12, 3)

  bonLivraison          BonLivraison           @relation(fields: [bon_livraison_id], references: [id], onDelete: Cascade)
  article               Article                @relation(fields: [article_id], references: [id])
}

model BonSortie {
  id                    String                 @id @default(uuid())
  organization_id       String
  numero_bs             String                 // 'BS-2026-0012'
  magasin_source_id     String
  chantier_dest_id      String
  statut                StatutOperationnel     @default(BROUILLON)
  date_sortie           DateTime               @db.Date
  motif                 String?
  extourne_de_id        String?

  magasinSource         Magasin                @relation(fields: [magasin_source_id], references: [id])
  chantierDest          Chantier               @relation(fields: [chantier_dest_id], references: [id])
  lignes                BonSortieLigne[]
}

model BonSortieLigne {
  id                    String                 @id @default(uuid())
  bon_sortie_id         String
  article_id            String
  quantite_sortie       Decimal                @db.Decimal(12, 3)

  bonSortie             BonSortie              @relation(fields: [bon_sortie_id], references: [id], onDelete: Cascade)
  article               Article                @relation(fields: [article_id], references: [id])
}

model MouvementStock {
  id                    String                 @id @default(uuid())
  organization_id       String
  article_id            String
  type_mouvement        TypeMouvementStock
  quantite              Decimal                @db.Decimal(12, 3)
  cout_unitaire_ht      Decimal                @default(0.00) @db.Decimal(14, 2)
  valeur_totale_ht      Decimal                @default(0.00) @db.Decimal(14, 2)
  chantier_id           String?
  magasin_id            String?
  reference_document    String?                // 'BL-1204', 'BS-0012'
  statut                StatutOperationnel     @default(ENREGISTRE)
  extourne_de_id        String?
  created_at            DateTime               @default(now())

  article               Article                @relation(fields: [article_id], references: [id])
}

// -------------------------------------------------------------
// MODULE 6 : MAIN D'ŒUVRE, OUVRIERS & POINTAGES
// -------------------------------------------------------------

model Ouvrier {
  id                    String                 @id @default(uuid())
  organization_id       String
  nom                   String
  prenom                String
  cin                   String?                // CIN marocaine
  cnss                  String?                // Numéro d'immatriculation CNSS
  metier                String                 // 'Maçon', 'Ferrailleur', 'Coffreur', 'Manœuvre'
  type_contrat          TypeContratOuvrier     @default(JOURNALIER)
  taux_journalier_mad   Decimal                @default(0.00) @db.Decimal(10, 2)
  taux_horaire_mad      Decimal                @default(0.00) @db.Decimal(10, 2)
  actif                 Boolean                @default(true)
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  pointages             PointageLigne[]
  acomptes              AcompteOuvrier[]
}

model Pointage {
  id                    String                 @id @default(uuid())
  organization_id       String
  chantier_id           String
  date_pointage         DateTime               @db.Date
  statut                StatutOperationnel     @default(BROUILLON)
  valide_par_id         String?
  extourne_de_id        String?
  created_at            DateTime               @default(now())

  chantier              Chantier               @relation(fields: [chantier_id], references: [id], onDelete: Cascade)
  lignes                PointageLigne[]

  @@unique([chantier_id, date_pointage])
}

model PointageLigne {
  id                    String                 @id @default(uuid())
  pointage_id           String
  ouvrier_id            String
  statut_presence       String                 @default("PRESENT") // 'PRESENT', 'DEMI_JOURNEE', 'ABSENT'
  heures_normales       Decimal                @default(8.00) @db.Decimal(4, 2)
  heures_sup            Decimal                @default(0.00) @db.Decimal(4, 2)
  cout_total_calcule    Decimal                @default(0.00) @db.Decimal(14, 2)

  pointage              Pointage               @relation(fields: [pointage_id], references: [id], onDelete: Cascade)
  ouvrier               Ouvrier                @relation(fields: [ouvrier_id], references: [id])
}

model AcompteOuvrier {
  id                    String                 @id @default(uuid())
  ouvrier_id            String
  chantier_id           String
  montant_mad           Decimal                @db.Decimal(10, 2)
  date_acompte          DateTime               @db.Date
  statut                StatutOperationnel     @default(BROUILLON)
  motif                 String?

  ouvrier               Ouvrier                @relation(fields: [ouvrier_id], references: [id])
}

// -------------------------------------------------------------
// MODULE 7 : ENGINS & PARC MATÉRIEL
// -------------------------------------------------------------

model Engin {
  id                    String                 @id @default(uuid())
  organization_id       String
  code_interne          String                 // 'ENG-001'
  nom                   String                 // 'Grue Potain MC85'
  categorie             String                 // 'LEVAGE', 'TERRASSEMENT', 'TRANSPORT'
  immatriculation       String?
  cout_horaire_interne  Decimal                @default(0.00) @db.Decimal(10, 2)
  compteur_horaire      Decimal                @default(0.00) @db.Decimal(10, 2)
  statut                String                 @default("DISPONIBLE") // 'DISPONIBLE', 'AFFECTE', 'EN_MAINTENANCE'

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  affectations          AffectationEngin[]
}

model AffectationEngin {
  id                    String                 @id @default(uuid())
  engin_id              String
  chantier_id           String
  date_debut            DateTime               @db.Date
  date_fin              DateTime?              @db.Date
  statut                StatutOperationnel     @default(BROUILLON)

  engin                 Engin                  @relation(fields: [engin_id], references: [id])
  chantier              Chantier               @relation(fields: [chantier_id], references: [id])
}

// -------------------------------------------------------------
// MODULE 8 : DÉPENSES & ÉCRITURES CONSOLIDÉES (GRAND LIVRE)
// -------------------------------------------------------------

model Depense {
  id                    String                 @id @default(uuid())
  organization_id       String
  chantier_id           String
  tiers_fournisseur_id  String?
  categorie             CategorieDepense
  reference_piece       String                 // Facture N°, Reçu N°
  date_depense          DateTime               @db.Date
  montant_ht            Decimal                @db.Decimal(14, 2)
  taux_tva              Decimal                @default(20.00) @db.Decimal(5, 2)
  montant_tva           Decimal                @default(0.00) @db.Decimal(14, 2)
  montant_ttc           Decimal                @db.Decimal(14, 2)
  mode_paiement         String?                // 'VIREMENT', 'CHEQUE', 'EFFET', 'ESPECES', 'CAISSE_CHANTIER'
  statut                StatutOperationnel     @default(BROUILLON)
  extourne_de_id        String?
  justificatif_url      String?
  description           String?
  created_at            DateTime               @default(now())

  chantier              Chantier               @relation(fields: [chantier_id], references: [id], onDelete: Cascade)
  fournisseur           Tiers?                 @relation(fields: [tiers_fournisseur_id], references: [id])
}

model EcritureConsolidee {
  id                    String                 @id @default(uuid())
  organization_id       String
  chantier_id           String
  date_ecriture         DateTime               @db.Date
  categorie             CategorieDepense
  source_module         String                 // 'STOCK', 'MAIN_DOEUVRE', 'ENGIN', 'DEPENSE_DIRECTE', 'DECOMPTE'
  source_id             String                 // ID de la ligne source
  reference_piece       String?
  debit_mad             Decimal                @default(0.00) @db.Decimal(14, 2)
  credit_mad            Decimal                @default(0.00) @db.Decimal(14, 2)
  description           String
  statut                StatutOperationnel     @default(ENREGISTRE)
  extourne_de_id        String?                // Référence si contre-passation
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  chantier              Chantier               @relation(fields: [chantier_id], references: [id], onDelete: Cascade)

  @@index([organization_id, chantier_id, date_ecriture])
}

model PisteAudit {
  id                    String                 @id @default(uuid())
  organization_id       String
  user_id               String?
  action                String                 // 'CREER_DECOMPTE', 'APPROUVER_SORTIE_STOCK', 'EXTOURNE'
  entite_nom            String                 // 'Decompte', 'BonSortie', 'Pointage'
  entite_id             String
  details               Json?
  ip_address            String?
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  user                  User?                  @relation(fields: [user_id], references: [id])

  @@index([organization_id, entite_nom, entite_id])
}

// ===============================================================
// EXTENSION DE PÉRIMÈTRE (ADR-009, 2026-10-20)
// Modules génériques multi-métiers : Clients/Devis/Factures,
// Paie Marocaine, Matériel/Équipement, RH, Documents, Notifications.
// Statut : spécification de schéma, non appliquée/migrée (même
// réserve que §1 pour le schéma BTP d'origine).
// ===============================================================

enum TypeClient {
  PARTICULIER
  SOCIETE
  ENTITE_PUBLIQUE
}

enum StatutDevisFacture {
  BROUILLON
  ENVOYE
  ACCEPTE          // Devis uniquement
  REFUSE           // Devis uniquement
  EXPIRE           // Devis uniquement
  CONVERTI         // Devis uniquement — transformé en facture/projet
  PARTIELLEMENT_PAYEE // Facture uniquement
  PAYEE            // Facture uniquement
  ANNULE
}

enum TypeContratTravailleur {
  CDI
  CDD
  ANAPEC
  STAGE
  JOURNALIER
  SOUS_TRAITANT
}

enum StatutTravailleur {
  ACTIF
  SUSPENDU
  TERMINE
  LISTE_NOIRE
}

enum TypePrime {
  PERFORMANCE
  FIN_PROJET
  HEURES_SUPPLEMENTAIRES
  COMMISSION
  CONGES
  EXCEPTIONNELLE
  AUTRE
}

enum ProprieteMateriel {
  INTERNE
  LOUE
  SOUS_TRAITANT
}

enum StatutMateriel {
  DISPONIBLE
  AFFECTE
  MAINTENANCE
  HORS_SERVICE
  PERDU
  VENDU
}

enum TypeDocument {
  DEVIS
  FACTURE
  BON_COMMANDE
  BON_LIVRAISON
  CONTRAT
  ATTESTATION_TRAVAIL
  ORDRE_MISSION
  PROCES_VERBAL
  RECU_PAIEMENT
  FICHE_CHANTIER
  RAPPORT_JOURNALIER
  BON_SORTIE_MATERIEL
  FICHE_PAIE
  ATTESTATION_CNSS
  AUTRE
}

// ---------------------------------------------------------------
// MODULE 10 : CLIENTS, DEVIS & FACTURES GÉNÉRIQUES
// ---------------------------------------------------------------

model Client {
  id                    String                 @id @default(uuid())
  organization_id       String
  type_client           TypeClient             @default(SOCIETE)
  nom                   String
  contact_principal     String?
  telephone             String?
  whatsapp              String?
  email                 String?
  adresse               String?
  ville                 String?
  region                String?
  ice                   String?
  if_num                String?
  rc                    String?
  cnss_num              String?
  conditions_paiement_jours Int                @default(30)
  encours_autorise_mad  Decimal                @default(0.00) @db.Decimal(14, 2)
  tags                  String[]               @default([])
  notes                 String?                @db.Text
  created_by            String?
  updated_by            String?
  created_at            DateTime               @default(now())
  updated_at            DateTime               @updatedAt
  deleted_at            DateTime?

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  quotations            Quotation[]
  invoices              Invoice[]
  projects              Chantier[]             @relation("ClientGenerique")

  @@index([organization_id, deleted_at])
}

model Quotation {
  id                    String                 @id @default(uuid())
  organization_id       String
  client_id             String
  chantier_id           String?
  numero                String                 // généré depuis Organization.numerotation_devis
  objet                 String?
  date_emission         DateTime               @db.Date
  date_validite         DateTime?              @db.Date
  pourcentage_acompte   Decimal                @default(0.00) @db.Decimal(5, 2)
  total_ht              Decimal                @default(0.00) @db.Decimal(14, 2)
  total_tva             Decimal                @default(0.00) @db.Decimal(14, 2)
  total_ttc             Decimal                @default(0.00) @db.Decimal(14, 2)
  statut                StatutDevisFacture     @default(BROUILLON)
  converti_vers_facture_id String?             @unique
  created_by            String?
  updated_by            String?
  created_at            DateTime               @default(now())
  updated_at            DateTime               @updatedAt

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  client                Client                 @relation(fields: [client_id], references: [id])
  chantier              Chantier?              @relation(fields: [chantier_id], references: [id])
  lignes                QuotationLigne[]
  factureConvertie      Invoice?               @relation("DevisVersFacture", fields: [converti_vers_facture_id], references: [id])

  @@unique([organization_id, numero])
  @@index([organization_id, statut])
}

model QuotationLigne {
  id                    String                 @id @default(uuid())
  organization_id       String
  quotation_id          String
  designation           String
  unite                 String                 @default("u")
  quantite              Decimal                @db.Decimal(12, 3)
  prix_unitaire_ht       Decimal               @db.Decimal(14, 2)
  remise_pourcent       Decimal                @default(0.00) @db.Decimal(5, 2)
  taux_tva              Decimal                @default(20.00) @db.Decimal(5, 2)
  total_ligne_ht        Decimal                @db.Decimal(14, 2)

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  quotation             Quotation              @relation(fields: [quotation_id], references: [id], onDelete: Cascade)

  @@index([organization_id, quotation_id])
}

model Invoice {
  id                    String                 @id @default(uuid())
  organization_id       String
  client_id             String
  chantier_id           String?
  quotation_id          String?                @unique
  numero                String                 // généré depuis Organization.numerotation_facture
  date_emission         DateTime               @db.Date
  date_echeance         DateTime               @db.Date
  retenue_source_pourcent Decimal              @default(0.00) @db.Decimal(5, 2) // Retenue à la source si applicable
  total_ht              Decimal                @default(0.00) @db.Decimal(14, 2)
  total_tva             Decimal                @default(0.00) @db.Decimal(14, 2)
  total_ttc             Decimal                @default(0.00) @db.Decimal(14, 2)
  total_paye            Decimal                @default(0.00) @db.Decimal(14, 2)
  statut                StatutDevisFacture     @default(BROUILLON)
  extourne_de_id        String?
  created_by            String?
  updated_by            String?
  created_at            DateTime               @default(now())
  updated_at            DateTime               @updatedAt

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  client                Client                 @relation(fields: [client_id], references: [id])
  chantier              Chantier?              @relation(fields: [chantier_id], references: [id])
  devisOrigine          Quotation?             @relation("DevisVersFacture")
  lignes                InvoiceLigne[]
  paiements             Payment[]

  @@unique([organization_id, numero])
  @@index([organization_id, statut])
}

model InvoiceLigne {
  id                    String                 @id @default(uuid())
  organization_id       String
  invoice_id            String
  designation           String
  unite                 String                 @default("u")
  quantite              Decimal                @db.Decimal(12, 3)
  prix_unitaire_ht       Decimal               @db.Decimal(14, 2)
  remise_pourcent       Decimal                @default(0.00) @db.Decimal(5, 2)
  taux_tva              Decimal                @default(20.00) @db.Decimal(5, 2)
  total_ligne_ht        Decimal                @db.Decimal(14, 2)

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  invoice               Invoice                @relation(fields: [invoice_id], references: [id], onDelete: Cascade)

  @@index([organization_id, invoice_id])
}

model Payment {
  // Encaissement client — distinct de Depense (sortie d'argent). Portée idempotence : cf. ARCHITECTURE.md §6.
  id                    String                 @id @default(uuid())
  organization_id       String
  invoice_id            String?
  client_id             String?
  chantier_id           String?
  montant_mad           Decimal                @db.Decimal(14, 2)
  mode_paiement         String                 // 'ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE', 'MOBILE', 'AUTRE'
  date_paiement         DateTime               @db.Date
  reference             String?
  justificatif_url      String?
  statut                StatutOperationnel     @default(BROUILLON)
  extourne_de_id        String?
  idempotency_key       String?
  created_by            String?
  updated_by            String?
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  invoice               Invoice?               @relation(fields: [invoice_id], references: [id])

  @@unique([organization_id, idempotency_key])
  @@index([organization_id, invoice_id])
}

model ExpenseCategory {
  // Catégories de dépense personnalisables par société — remplace l'usage exclusif de l'enum
  // CategorieDepense (conservé pour la classification analytique BTP de haut niveau).
  id                    String                 @id @default(uuid())
  organization_id       String
  code                  String                 // 'MATERIAUX', 'CARBURANT', 'LOYER', ... ou code personnalisé
  libelle               String
  est_defaut            Boolean                @default(false)
  actif                 Boolean                @default(true)

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)

  @@unique([organization_id, code])
}

model Bonus {
  // Prime — distincte de Depense pour isoler les primes dans les rapports RH (cf. Module 11).
  id                    String                 @id @default(uuid())
  organization_id       String
  worker_id             String
  chantier_id           String?
  type_prime            TypePrime
  montant_mad           Decimal                @db.Decimal(10, 2)
  date_prime            DateTime               @db.Date
  motif                 String?
  statut                StatutOperationnel     @default(BROUILLON)
  extourne_de_id        String?
  created_by            String?
  updated_by            String?
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  worker                Worker                 @relation(fields: [worker_id], references: [id])

  @@index([organization_id, worker_id])
}

// ---------------------------------------------------------------
// MODULE 11 : RH & PAIE MAROCAINE
// ---------------------------------------------------------------

model Worker {
  // Généralise Ouvrier (conservé pour la main-d'œuvre chantier BTP) à tout collaborateur de
  // l'entreprise nécessitant un bulletin de paie et un dossier RH complet.
  id                    String                 @id @default(uuid())
  organization_id       String
  nom                   String
  prenom                String
  cin                   String?
  date_naissance        DateTime?              @db.Date
  genre                 String?
  telephone             String?
  whatsapp              String?
  email                 String?
  adresse               String?
  photo_url             String?
  cnss_num              String?
  rib                   String?
  banque                String?
  type_contrat          TypeContratTravailleur @default(JOURNALIER)
  poste                 String?
  departement            String?
  date_embauche         DateTime?              @db.Date
  date_fin_contrat      DateTime?              @db.Date
  salaire_base_mad      Decimal                @default(0.00) @db.Decimal(14, 2)
  taux_journalier_mad   Decimal                @default(0.00) @db.Decimal(10, 2)
  taux_horaire_mad      Decimal                @default(0.00) @db.Decimal(10, 2)
  nombre_dependants     Int                    @default(0)
  contact_urgence_nom   String?
  contact_urgence_tel   String?
  statut                StatutTravailleur      @default(ACTIF)
  created_by            String?
  updated_by            String?
  created_at            DateTime               @default(now())
  updated_at            DateTime               @updatedAt
  deleted_at            DateTime?

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  bonus                 Bonus[]
  payslips              Payslip[]
  equipmentAssignments  EquipmentAssignment[]

  @@index([organization_id, statut])
}

model PayrollRule {
  // Taux paramétrables, versionnés par date d'effet — jamais codés en dur (ADR-009, PRODUCT_SPEC.md §7).
  id                    String                 @id @default(uuid())
  organization_id       String
  code                  String                 // 'CNSS_SALARIE', 'AMO_SALARIE', 'CNSS_EMPLOYEUR', 'TFP', 'PLAFOND_CNSS', 'BAREME_IR', ...
  libelle               String
  valeur                Json                   // Taux simple (number) ou structure (ex. tranches du barème IR)
  date_effet            DateTime               @db.Date
  date_fin_effet        DateTime?              @db.Date
  created_by            String?
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)

  @@unique([organization_id, code, date_effet])
  @@index([organization_id, code])
}

model PayrollPeriod {
  id                    String                 @id @default(uuid())
  organization_id       String
  periode_debut         DateTime               @db.Date
  periode_fin           DateTime               @db.Date
  statut                StatutOperationnel     @default(BROUILLON)
  valide_par_id         String?
  date_validation       DateTime?
  created_by            String?
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  payslips              Payslip[]

  @@unique([organization_id, periode_debut, periode_fin])
}

model Payslip {
  // Cycle BROUILLON → SOUMIS → APPROUVE → ENREGISTRE identique au reste de la plateforme (ADR-009).
  // Un ENREGISTRE n'est autorisé que si Organization.payroll_config_validated_at est non nul.
  id                    String                 @id @default(uuid())
  organization_id       String
  payroll_period_id     String
  worker_id             String
  salaire_base_mad      Decimal                @db.Decimal(14, 2)
  jours_travailles      Decimal                @default(0.00) @db.Decimal(5, 2)
  heures_sup_mad        Decimal                @default(0.00) @db.Decimal(14, 2)
  primes_mad            Decimal                @default(0.00) @db.Decimal(14, 2)
  indemnites_mad        Decimal                @default(0.00) @db.Decimal(14, 2)
  salaire_brut_mad      Decimal                @default(0.00) @db.Decimal(14, 2)
  cnss_salarie_mad      Decimal                @default(0.00) @db.Decimal(14, 2)
  amo_salarie_mad       Decimal                @default(0.00) @db.Decimal(14, 2)
  ir_mad                Decimal                @default(0.00) @db.Decimal(14, 2)
  avances_deduites_mad  Decimal                @default(0.00) @db.Decimal(14, 2)
  salaire_net_mad       Decimal                @default(0.00) @db.Decimal(14, 2)
  charges_patronales_mad Decimal               @default(0.00) @db.Decimal(14, 2)
  cout_total_employeur_mad Decimal             @default(0.00) @db.Decimal(14, 2)
  statut                StatutOperationnel     @default(BROUILLON)
  extourne_de_id        String?
  pdf_url               String?
  created_by            String?
  updated_by            String?
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  payrollPeriod         PayrollPeriod          @relation(fields: [payroll_period_id], references: [id], onDelete: Cascade)
  worker                Worker                 @relation(fields: [worker_id], references: [id])

  @@unique([payroll_period_id, worker_id])
  @@index([organization_id, statut])
}

// ---------------------------------------------------------------
// MODULE 12 : MATÉRIEL & ÉQUIPEMENT GÉNÉRIQUE
// ---------------------------------------------------------------

model Equipment {
  // Généralise Engin (conservé pour les engins de chantier BTP) à tout matériel/équipement
  // (événementiel, agence, négoce).
  id                    String                 @id @default(uuid())
  organization_id       String
  nom                   String
  code_interne          String
  categorie             String?
  marque_modele         String?
  numero_serie          String?
  date_achat            DateTime?              @db.Date
  prix_achat_mad        Decimal                @default(0.00) @db.Decimal(14, 2)
  valeur_actuelle_mad   Decimal                @default(0.00) @db.Decimal(14, 2)
  propriete             ProprieteMateriel      @default(INTERNE)
  etat                  String?                // 'NEUF', 'BON', 'USAGE', 'A_REPARER'
  statut                StatutMateriel         @default(DISPONIBLE)
  photo_url             String?
  prochaine_maintenance DateTime?              @db.Date
  derniere_maintenance  DateTime?              @db.Date
  notes                 String?                @db.Text
  created_by            String?
  updated_by            String?
  created_at            DateTime               @default(now())
  updated_at            DateTime               @updatedAt
  deleted_at            DateTime?

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  assignments           EquipmentAssignment[]

  @@unique([organization_id, code_interne])
  @@index([organization_id, statut])
}

model EquipmentAssignment {
  id                    String                 @id @default(uuid())
  organization_id       String
  equipment_id          String
  chantier_id           String?
  worker_responsable_id String?
  destination           String?
  date_affectation      DateTime               @db.Date
  date_retour_prevue    DateTime?              @db.Date
  date_retour_reelle    DateTime?              @db.Date
  cout_location_mad     Decimal                @default(0.00) @db.Decimal(14, 2)
  statut                StatutOperationnel     @default(BROUILLON)
  notes                 String?
  created_by            String?
  created_at            DateTime               @default(now())

  equipment             Equipment              @relation(fields: [equipment_id], references: [id])
  chantier              Chantier?              @relation(fields: [chantier_id], references: [id])
  workerResponsable     Worker?                @relation(fields: [worker_responsable_id], references: [id])

  @@index([organization_id, equipment_id])
}

// ---------------------------------------------------------------
// MODULE 13 : MOTEUR DE DOCUMENTS & NOTIFICATIONS
// ---------------------------------------------------------------

model DocumentTemplate {
  id                    String                 @id @default(uuid())
  organization_id       String
  type_document         TypeDocument
  nom                   String
  langue                String                 @default("fr")        // 'fr', 'ar', 'en'
  contenu_html          String                 @db.Text
  variables_disponibles Json?
  est_defaut            Boolean                @default(false)
  version               Int                    @default(1)
  created_by            String?
  created_at            DateTime               @default(now())
  updated_at            DateTime               @updatedAt

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  generatedDocuments    GeneratedDocument[]

  @@index([organization_id, type_document])
}

model GeneratedDocument {
  id                    String                 @id @default(uuid())
  organization_id       String
  document_template_id  String?
  type_document         TypeDocument
  chantier_id           String?
  entite_liee_type       String?               // 'Quotation', 'Invoice', 'Payslip', ...
  entite_liee_id        String?
  pdf_url               String
  partage_lien_public   String?                @unique
  partage_expiration    DateTime?
  partage_mot_de_passe_hash String?
  created_by            String?
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  template              DocumentTemplate?      @relation(fields: [document_template_id], references: [id])

  @@index([organization_id, type_document])
  @@index([organization_id, entite_liee_type, entite_liee_id])
}

model Notification {
  id                    String                 @id @default(uuid())
  organization_id       String
  user_id               String
  type                  String                 // 'TACHE_ASSIGNEE', 'DEPENSE_A_APPROUVER', 'PAIEMENT_RECU', 'FACTURE_ECHUE', 'STOCK_FAIBLE', 'RETOUR_MATERIEL_DU', 'PAIE_A_APPROUVER', 'ECHEANCE_DECLARATION', ...
  titre                 String
  message               String?
  lien                  String?
  lu                    Boolean                @default(false)
  created_at            DateTime               @default(now())

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)

  @@index([organization_id, user_id, lu])
}

model Setting {
  // Paramètres société clé/valeur (ex. seuils d'approbation, workflow activé par module).
  id                    String                 @id @default(uuid())
  organization_id       String
  cle                   String
  valeur                Json
  updated_by            String?
  updated_at            DateTime               @updatedAt

  organization          Organization           @relation(fields: [organization_id], references: [id], onDelete: Cascade)

  @@unique([organization_id, cle])
}
```
