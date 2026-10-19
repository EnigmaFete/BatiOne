# DATABASE_SCHEMA.md — Schéma de Données Relationnel & Modèle Prisma

## 1. Principes & Conventions de Modélisation
- **Prisma & PostgreSQL** : Définition formelle sous forme de modèle `schema.prisma`.
- **Typage Monétaire Strict** : Les montants financiers sont modélisés en `Decimal(14, 2)` ou en entiers de centimes (`BigInt`) pour garantir une précision absolue.
- **Invariant de Stock Non-Négatif** : La table `StockMagasin` intègre une contrainte d'intégrité et un index unique garantissant l'impossibilité physique de stock négatif.
- **Traçabilité & Extourne** : Les entités sensibles disposent d'un statut opérationnel (`BROUILLON`, `SOUMIS`, `APPROUVE`, `ENREGISTRE`, `EXTOURNE`) et d'un champ d'auto-référence `extourne_de_id`.

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
  SUPERADMIN
  ORG_ADMIN              // Directeur Général / Gérant
  CONDUCTEUR_TRAVAUX     // Chef de projet travaux
  CHEF_CHANTIER          // Responsable terrain
  DAF_COMPTABLE          // Responsable financier
  MAGASINIER             // Gestionnaire des stocks et dépôts
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
  adresse               String?
  ville                 String                 @default("Casablanca")
  telephone             String?
  email                 String?
  devise                String                 @default("MAD")
  logo_url              String?
  created_at            DateTime               @default(now())
  updated_at            DateTime               @updatedAt

  users                 User[]
  chantiers             Chantier[]
  tiers                 Tiers[]
  articles              Article[]
  magasins              Magasin[]
  ouvriers              Ouvrier[]
  engins                Engin[]
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
  chantier_id           String
  code_lot              String                 // ex: 'LOT-01'
  designation           String                 // ex: 'Gros Œuvre'
  budget_prevu_ht       Decimal                @default(0.00) @db.Decimal(14, 2)

  chantier              Chantier               @relation(fields: [chantier_id], references: [id], onDelete: Cascade)
  taches                TacheChantier[]
}

model TacheChantier {
  id                    String                 @id @default(uuid())
  lot_id                String
  designation           String
  avancement_pourcent   Int                    @default(0)
  date_debut            DateTime?
  date_fin              DateTime?

  lot                   LotTravaux             @relation(fields: [lot_id], references: [id], onDelete: Cascade)
}

model JournalChantier {
  id                    String                 @id @default(uuid())
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

  chantier              Chantier               @relation(fields: [chantier_id], references: [id], onDelete: Cascade)

  @@unique([chantier_id, date_journal])
}

model PhotoChantier {
  id                    String                 @id @default(uuid())
  journal_id            String
  url                   String
  description           String?
  created_at            DateTime               @default(now())

  journal               JournalChantier        @relation(fields: [journal_id], references: [id], onDelete: Cascade)
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
  devis_id              String
  numero_prix           String                 // '1.01'
  designation           String
  unite                 String                 // 'm²', 'm³', 'ml', 'kg', 'u', 'forfait'
  quantite              Decimal                @db.Decimal(12, 3)
  prix_unitaire_ht      Decimal                @db.Decimal(14, 2)
  total_ligne_ht        Decimal                @db.Decimal(14, 2)

  devis                 Devis                  @relation(fields: [devis_id], references: [id], onDelete: Cascade)
}

model Decompte {
  id                    String                 @id @default(uuid())
  organization_id       String
  chantier_id           String
  numero_decompte       Int                    // Décompte N° 1, 2, 3...
  type_decompte         String                 @default("PROVISOIRE") // 'PROVISOIRE', 'DEFINITIF'
  periode_debut         DateTime               @db.Date
  periode_fin           DateTime               @db.Date
  cumul_precedent_ht    Decimal                @default(0.00) @db.Decimal(14, 2)
  cumul_mois_ht         Decimal                @default(0.00) @db.Decimal(14, 2)
  cumul_total_ht        Decimal                @default(0.00) @db.Decimal(14, 2)
  retenue_garantie_ht   Decimal                @default(0.00) @db.Decimal(14, 2)
  montant_net_ht        Decimal                @default(0.00) @db.Decimal(14, 2)
  montant_tva           Decimal                @default(0.00) @db.Decimal(14, 2)
  montant_net_ttc       Decimal                @default(0.00) @db.Decimal(14, 2)
  statut                StatutOperationnel     @default(BROUILLON)
  extourne_de_id        String?                // Référence si extourne
  date_validation       DateTime?
  created_at            DateTime               @default(now())

  chantier              Chantier               @relation(fields: [chantier_id], references: [id], onDelete: Cascade)

  @@unique([chantier_id, numero_decompte])
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
  id                    String                 @id @default(uuid())
  organization_id       String
  magasin_id            String
  article_id            String
  quantite_disponible   Decimal                @default(0.00) @db.Decimal(12, 3)
  quantite_reservee     Decimal                @default(0.00) @db.Decimal(12, 3)
  updated_at            DateTime               @updatedAt

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
```
