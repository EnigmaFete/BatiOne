# DECISIONS.md — Architecture Decision Records (ADR)

## Sommaire des Décisions d'Architecture
- [ADR-001 : Délimitation du Périmètre Financier Opérationnel vs Comptabilité Légale](#adr-001--délimitation-du-périmètre-financier-opérationnel-vs-comptabilité-légale)
- [ADR-002 : Invariant Strict Anti-Stock Négatif avec Verrouillage Transactionnel](#adr-002--invariant-strict-anti-stock-négatif-avec-verrouillage-transactionnel)
- [ADR-003 : Cycle de Vie en 4 États et Contre-Passation par Extourne](#adr-003--cycle-de-vie-en-4-états-et-contre-passation-par-extourne)
- [ADR-004 : Architecture Monorepo NestJS + Next.js + Prisma](#adr-004--architecture-monorepo-nestjs--nextjs--prisma)
- [ADR-005 : Isolation Multi-Tenant par Extension de Client Prisma](#adr-005--isolation-multi-tenant-par-extension-de-client-prisma)
- [ADR-006 : Conception en Français d'Abord (French-First) et i18n-Ready](#adr-006--conception-en-français-dabord-french-first-et-i18n-ready)
- [ADR-007 : Représentation Monétaire en Décimal Fixe Haute Précision](#adr-007--représentation-monétaire-en-décimal-fixe-haute-précision)
- [ADR-008 : Grand Livre des Écritures Consolidées et Piste d'Audit](#adr-008--grand-livre-des-écritures-consolidées-et-piste-daudit)
- [ADR-009 : Extension du Périmètre vers une Plateforme de Gestion Multi-Métiers](#adr-009--extension-du-périmètre-vers-une-plateforme-de-gestion-multi-métiers)

---

### ADR-001 : Délimitation du Périmètre Financier Opérationnel vs Comptabilité Légale
- **Statut** : Accepté
- **Contexte** : Les entreprises de BTP au Maroc utilisent souvent un logiciel de comptabilité statutaire certifié (Sage, Odoo, Cegid, etc.) ou font appel à un cabinet fiduciaire pour la liasse fiscale. BatiOne doit leur apporter ce qui leur manque cruellement : le contrôle des coûts de chantiers en temps réel (Job-Costing) et la facturation client BTP (décomptes).
- **Décision** : BatiOne se concentre exclusivement sur les finances opérationnelles (budgets de chantiers, engagements, dépenses réelles, décomptes avec retenues de garantie, marges opérationnelles). BatiOne ne génère pas de bilan comptable légal, mais fournit des exports consolidés universels (Excel/CSV/API) pour les progiciels comptables externes.
- **Conséquences** : Clarté du périmètre, agilité de développement, adoption immédiate sans conflit avec les experts-comptables.

---

### ADR-002 : Invariant Strict Anti-Stock Négatif avec Verrouillage Transactionnel
- **Statut** : Accepté
- **Contexte** : Dans le BTP, le laxisme dans les sorties de stock (sorties sans stock suffisant en espérant une régularisation ultérieure) masque les vols, les pertes et fausse gravement le coût réel des chantiers.
- **Décision** : Le système bloque rigoureusement toute sortie de stock excédant la quantité disponible au moment de la transaction. L'opération est exécutée dans une transaction interactive PostgreSQL avec verrou pessimiste (`SELECT ... FOR UPDATE` via Prisma). Si `quantite_sortie > quantite_disponible`, une exception `STOCK_INSUFFISANT` est levée.
- **Conséquences** : Les stocks reflètent rigoureusement la réalité physique ; les chefs de chantier doivent enregistrer leurs bons de livraison avant de pouvoir déstocker les matériaux.

---

### ADR-003 : Cycle de Vie en 4 États et Contre-Passation par Extourne
- **Statut** : Accepté
- **Contexte** : Les transactions opérationnelles sensibles (décomptes de plusieurs millions de MAD, sorties de matériaux de valeur, pointages ouvriers) ne peuvent pas être modifiées ou supprimées après validation sans risque de fraude ou d'incohérence historique.
- **Décision** : Adoption d'une machine d'états à 4 étapes :
  `BROUILLON` (Draft) ➔ `SOUMIS` (Submitted) ➔ `APPROUVE` (Approved) ➔ `ENREGISTRE` (Recorded).
  Tout enregistrement `ENREGISTRE` est scellé et immuable. Les corrections s'opèrent impérativement par une écriture d'**extourne contrôlée** (écriture symétrique inverse motivée).
- **Conséquences** : Piste d'audit irréfutable, conformité avec les standards de contrôle interne d'entreprise.

---

### ADR-004 : Architecture Monorepo NestJS + Next.js + Prisma
- **Statut** : Accepté
- **Contexte** : Le système nécessite un backend robuste avec injection de dépendances et architecture d'entreprise pour les règles métier complexes (NestJS), couplé à un frontend moderne, réactif et optimisé pour le mobile (Next.js), tout en partageant des types TypeScript stricts et le schéma de base de données.
- **Décision** : Structuration en monorepo (`apps/web`, `apps/api`, `packages/database`, `packages/shared-types`).
- **Conséquences** : Typage de bout en bout de la base de données jusqu'à l'écran, réutilisation des DTOs, isolation claire des responsabilités.

---

### ADR-005 : Isolation Multi-Tenant par Extension de Client Prisma
- **Statut** : Accepté
- **Contexte** : Le modèle SaaS multi-tenant héberge plusieurs entreprises concurrentes sur la même base PostgreSQL. Tout oubli d'une clause `WHERE organization_id = ...` par un développeur entraînerait une fuite de données inacceptable.
- **Décision** : Utiliser les extensions de client Prisma (`$extends`) au sein du middleware NestJS pour injecter automatiquement le filtre `organization_id` sur toutes les opérations de lecture et d'écriture des tables tenant.
- **Conséquences** : Sécurité garantie au niveau de l'infrastructure d'accès aux données, indépendante de la vigilance du développeur sur chaque endpoint.

---

### ADR-006 : Conception en Français d'Abord (French-First) et i18n-Ready
- **Statut** : Accepté
- **Contexte** : La langue d'usage du secteur BTP au Maroc pour l'ingénierie, la gestion contractuelle et administrative est le français, tout en prévoyant une extension naturelle vers l'arabe (notamment pour les interfaces des chefs de chantier sur le terrain) et l'anglais.
- **Décision** : Toute l'interface utilisateur, les modèles de documents PDF, les logs métiers et les messages d'erreur sont rédigés en français en première intention. Les textes de l'interface sont gérés via des fichiers de ressources localisables (`next-intl`), avec support prévu du sens de lecture droite-à-gauche (RTL) pour l'arabe.
- **Conséquences** : Adéquation immédiate avec le marché cible marocain et extensibilité future sans refactoring de code.

---

### ADR-007 : Représentation Monétaire en Décimal Fixe Haute Précision
- **Statut** : Accepté
- **Contexte** : Les calculs de métrés et de TVA sur des marchés de construction génèrent des écarts financiers inacceptables si des types à virgule flottante standard (Float/Double) sont employés.
- **Décision** : Utiliser systématiquement `Prisma.Decimal` avec type SQL `DECIMAL(14, 2)` pour les montants monétaires en MAD et `DECIMAL(12, 3)` pour les quantités de métrés.
- **Conséquences** : Exactitude arithmétique rigoureuse sans dérive de virgule flottante.

---

### ADR-008 : Grand Livre des Écritures Consolidées et Piste d'Audit
- **Statut** : Accepté
- **Contexte** : Pour suivre la rentabilité réelle et identifier l'origine de chaque coût (stock consommé, journée d'ouvrier pointée, heure d'engin imputée, facture sous-traitant reçue), le système doit disposer d'une vue consolidée de tous les flux.
- **Décision** : Chaque mouvement opérationnel scellé génère automatiquement une ligne dans la table `EcritureConsolidee` (débit/crédit rattaché à un chantier et une catégorie de dépense) ainsi qu'un enregistrement dans `PisteAudit`.
- **Conséquences** : Calcul instantané des marges réelles de chaque chantier sans jointures lourdes sur 8 tables distinctes.

---

### ADR-009 : Extension du Périmètre vers une Plateforme de Gestion Multi-Métiers
- **Statut** : Accepté (2026-10-20) — **supersède partiellement ADR-001**.
- **Contexte** : Le cadrage initial (ADR-001, 2026-10-19) limitait volontairement BatiOne au job-costing BTP, en excluant explicitement la paie, la facturation client classique et la gestion générique du matériel/RH. Le propriétaire produit a validé une demande explicite d'élargissement : BatiOne doit devenir une plateforme de gestion d'entreprise complète pour les PME marocaines au sens large (BTP, événementiel, agences, services, négoce), avec paie marocaine, devis/factures génériques, gestion du matériel, RH et un moteur de génération documentaire.
- **Décision** :
  1. **Le périmètre exclu d'ADR-001 est restreint** : BatiOne reste un outil de gestion opérationnelle (pas de bilan comptable légal, pas de liasse fiscale — ce point précis d'ADR-001 est **maintenu**), mais BatiOne **assure désormais** la facturation client générique (devis/factures, pas seulement les décomptes BTP), la paie marocaine opérationnelle (bulletins, CNSS/AMO/IR — cf. §2.3 ci-dessous sur le statut de validation requis), la gestion du matériel/équipement générique, et un registre RH complet.
  2. **Les modules et invariants BTP existants ne sont pas supprimés** : `Chantier`, `LotTravaux`, `Devis`/`DecompteLigne` (BPU), `Decompte` (décomptes provisoires/définitifs avec retenue de garantie) restent le sous-domaine "chantier BTP" de la plateforme, utilisé quand `Project.type = CONSTRUCTION`. Les nouveaux modules génériques (`Quotation`/`Invoice`, `PayrollRule`/`PayrollPeriod`/`Payslip`, `Equipment`, `Worker`) s'appliquent à tous les types de projets, BTP inclus — un chantier BTP peut avoir à la fois un `Decompte` (facturation BPU cumulative) et une `Invoice` générique (ex. pour une facture d'acompte simple), selon le besoin de l'entreprise.
  3. **La matrice RBAC passe de 6 à 11 rôles** (10 rôles métier + `SUPERADMIN` plateforme) pour couvrir Manager générique, RH/Paie, Gestionnaire Matériel, Employé/Ouvrier (accès self-service) et Lecteur (lecture seule) — cf. `SECURITY_MODEL.md` §2 révisé.
  4. **La paie marocaine est strictement paramétrable** (`PayrollRule` versionné par date d'effet) — aucun taux CNSS/AMO/IR n'est codé en dur dans la logique métier. Les taux de référence 2026 cités dans la demande produit sont chargés comme **valeurs de départ non validées**, avec blocage explicite de toute génération de bulletin en production tant qu'un comptable de l'entreprise cliente n'a pas validé la configuration (cf. `PRODUCT_SPEC.md` §7 et ADR à rédiger lors de l'implémentation de la Phase Paie).
- **Conséquences** :
  - Reclassification de marché : BatiOne n'est plus un outil vertical BTP uniquement, mais une plateforme horizontale avec un sous-domaine BTP approfondi. Cela augmente la surface de schéma, de RBAC et de tests, et prolonge la feuille de route (nouvelles phases 09–12, cf. `ROADMAP.md`).
  - Risque identifié : la coexistence de deux modèles de facturation (BPU/Décompte vs Devis/Facture générique) crée un risque de confusion utilisateur si l'interface ne clarifie pas quel flux appartient à quel type de projet — à traiter explicitement dans la conception UX de la Phase 03/09.
  - Aucune des garanties de sécurité/transaction déjà actées (isolation tenant, invariant de stock, cycle à 4 états, extourne) n'est affaiblie par cette extension ; les nouveaux modules sensibles (Payslip, Invoice) adoptent le même cycle `BROUILLON → SOUMIS → APPROUVE → ENREGISTRE` et le même mécanisme d'extourne.
