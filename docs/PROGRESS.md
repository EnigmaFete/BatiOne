# PROGRESS.md — État d'Avancement & Journal des Réalisations BatiOne

## 1. Vue d'Ensemble du Projet
- **Application** : BatiOne — ERP & Job-Costing SaaS Multi-Tenant pour le BTP au Maroc
- **Langue Principale** : Français (Architecture prête pour l'internationalisation / i18n)
- **Stack Validée** : Next.js + React + TypeScript (Frontend), NestJS + TypeScript (Backend), PostgreSQL + Prisma (Base de données & ORM), Vitest / Jest / Supertest (Tests automatisés).
- **Périmètre Financier** : Suivi financier opérationnel & contrôle des coûts de chantier (Job Costing). Pas de comptabilité générale/légale statutaire.

---

## 2. Tableau de Bord des Modules & Jalons

| Module | Statut Spécification | Statut Architecture / Schéma | Statut Implémentation | Statut Tests Automatisés |
| :--- | :---: | :---: | :---: | :---: |
| **0. Socle & Gouvernance** | ✅ Validé | ✅ Validé | ✅ Fait | ✅ Vert (lint/typecheck/build) |
| **1. Utilisateurs & Permissions (RBAC)** | ✅ Validé | 🔄 Organization/User/RefreshToken migrés (modèles étendus en Phases 09-13) | 🔄 Socle auth+RBAC fait (6/11 rôles exercés par les tests ; onboarding, JWT, lockout, tenant isolation) | ✅ Vert (36 tests : 26 unitaires, 6 intégration, 4 sécurité) |
| **2. Projets, Chantiers & Tâches** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **3. Clients, Marchés & Documents** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **4. Finance & Décomptes Opérationnels**| ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **5. Stocks & Approvisionnements** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **6. RH, Main d'Œuvre & Pointage** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **7. Parc Matériel & Engins** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **8. Écritures Consolidées & Audit** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **9. Tableaux de Bord & Analytics** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **10. Devis & Factures Génériques (ADR-009)** | ✅ Validé | 🔄 Schéma rédigé | ⏳ En attente | ⏳ Non démarré |
| **11. Paie Marocaine & RH Étendue (ADR-009)** | ✅ Validé | 🔄 Schéma rédigé | ⏳ En attente | ⏳ Non démarré |
| **12. Matériel Générique & Documents (ADR-009)** | ✅ Validé | 🔄 Schéma rédigé | ⏳ En attente | ⏳ Non démarré |
| **13. Notifications (ADR-009)** | ✅ Validé | 🔄 Schéma rédigé | ⏳ En attente | ⏳ Non démarré |

*Légende : ✅ Validé | 🔄 En cours | ⏳ En attente / Non démarré | ❌ Bloqué*

---

## 3. Règle d'Or de l'État d'Avancement (Vérité Vérifiée)
1. **Zéro affirmation sans exécution** : Un test n'est jamais déclaré "passé" ou "vert" tant qu'il n'a pas été effectivement exécuté dans l'environnement avec un code de retour 0.
2. **Synchronisation documentaire continue** : Tout changement de contrat d'API, de modèle de données ou de logique métier entraîne une mise à jour immédiate du présent fichier et des spécifications associées.

---

## 4. Historique des Décisions et Actions

### 2026-10-19 : Cadrage Architectural & Spécification Initiale
- Initialisation du référentiel Git distant [`EnigmaFete/BatiOne`](https://github.com/EnigmaFete/BatiOne).
- Définition de la gouvernance multi-agents dans `AGENTS.md` et `CLAUDE.md`.
- Élaboration complète du dossier de conception technique : spécifications produit, architecture système, schéma relationnel Prisma, contrats d'API NestJS, modèle de sécurité, stratégie de test, feuille de route et journal des décisions d'architecture (ADR).
- Définition des invariants stricts : cycle de vie en 4 étapes (`brouillon` ➔ `soumis` ➔ `approuvé` ➔ `enregistré`), mécanisme d'extourne contrôlée pour les enregistrements scellés, interdiction absolue des sorties de stock excédentaires (stock négatif bloqué au niveau transactionnel), et limitation du périmètre financier au job-costing opérationnel.
- Réconciliation formelle de la revue d'architecture indépendante dans `AGENTS.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md` et `docs/DATABASE_SCHEMA.md` : précision sur `Prisma.Decimal` (ADR-007), extourne ordonnée des décomptes (ADR-003), atomicité SQL des mouvements de stock (ADR-002), et isolation multi-tenant à double niveau (Prisma étendu + PostgreSQL RLS sans `BYPASSRLS`).

### 2026-10-20 : Extension du Périmètre vers une Plateforme Multi-Métiers (ADR-009)
- Décision produit validée : élargissement du périmètre initial (job-costing BTP uniquement) vers une plateforme de gestion d'entreprise complète pour PME marocaines (BTP, événementiel, agences, services, négoce), avec conservation intégrale du sous-domaine BTP (BPU/Décomptes/Retenue de garantie).
- Rédaction d'ADR-009 dans `docs/DECISIONS.md` : périmètre financier élargi (facturation générique + paie marocaine), matrice RBAC étendue de 6 à 11 rôles, coexistence explicite des deux moteurs de facturation (BPU/Décompte vs Devis/Facture générique).
- Mise à jour de `docs/PRODUCT_SPEC.md` (13 modules, 11 rôles, formats marocains §5, checklist onboarding §6, paramétrage paie obligatoire §7), `docs/SECURITY_MODEL.md` (matrice RBAC 11 rôles), `docs/DATABASE_SCHEMA.md` (extension `RoleUtilisateur`, nouveaux modèles `Client`/`Quotation`/`Invoice`/`Payment`/`ExpenseCategory`/`Bonus`/`Worker`/`PayrollRule`/`PayrollPeriod`/`Payslip`/`Equipment`/`EquipmentAssignment`/`DocumentTemplate`/`GeneratedDocument`/`Notification`/`Setting`), et `docs/ROADMAP.md` (Phases 09–12).
- **Statut** : extension documentaire uniquement à ce stade — aucun code n'existe encore dans le dépôt (le dossier ne contenait que `AGENTS.md`/`CLAUDE.md`/`README.md`/`docs/` avant ce jour). Démarrage immédiat du code à partir de Phase 00 (socle monorepo) puis Phase 01 (multi-tenant, auth, RBAC 11 rôles), conformément à la demande produit.

### 2026-10-20 : Phase 00 (Socle) & Phase 01 (Multi-Tenant, Auth, RBAC) — Implémentation & Vérification Exécutée
- **Socle monorepo** (`npm` workspaces) : `apps/api` (NestJS + TypeScript), `apps/web` (Next.js 14 App Router), `packages/database` (Prisma + PostgreSQL 16), `packages/shared-types`. ESLint/Prettier/TypeScript strict configurés à la racine.
- **Schéma réel migré** (`packages/database/prisma/schema.prisma`, migration `20261020100049_init` appliquée) : `Organization`, `User` (11 rôles via `RoleUtilisateur`, verrouillage de compte, soft delete), `RefreshToken`. **Décision explicite** : contrairement à `DATABASE_SCHEMA.md` (cible de conception non vérifiée couvrant ~30 modèles BTP + ADR-009), seuls les modèles strictement requis par les Phases 00/01 sont migrés maintenant — chaque modèle restant (Chantier, Finance, Stock, Paie, Matériel, Documents...) sera ajouté phase par phase avec sa propre migration validée, jamais en bloc non testé (cf. AGENTS.md §2.1 Règle Zéro).
- **Isolation multi-tenant à deux couches — Couche 1 implémentée et testée** : extension de client Prisma (`packages/database/src/tenantClient.ts`) injectant `organization_id` sur toutes les opérations (lecture, création, mise à jour, suppression — correctif IDOR du WHERE vs DATA inclus), exemptant `Organization`/`RefreshToken`. **Couche 2 (PostgreSQL RLS) reste non implémentée**, conformément au statut documenté dans `ARCHITECTURE.md` §4.1 — à traiter avant mise en production.
- **Authentification** : JWT HS256 (access 15 min + refresh 7 jours rotatif, cookie httpOnly), hachage Argon2id, verrouillage de compte après 5 échecs (15 min), middleware rejetant systématiquement tout en-tête `X-Tenant-ID` (`TENANT_HEADER_NOT_ALLOWED`), `JwtAuthGuard` + `RolesGuard` globaux (refus par défaut, `@Public()`/`@Roles()` explicites).
- **Onboarding** : `POST /organisations/inscription` crée `Organization` + premier `ORG_ADMIN` en une transaction unique (tout ou rien).
- **UI temporaire** (Next.js, design tokens CSS séparés de la logique métier) : pages Connexion, Inscription, Tableau de bord (sidebar 9 modules, topbar, checklist d'onboarding, KPI cards formatées en MAD, état vide "Créez votre premier projet").
- **Vérification réellement exécutée** (preuve d'exécution, pas une affirmation — cf. Règle Zéro) :
  - `npm run lint` → 0 erreur/avertissement sur les 4 workspaces.
  - `npm run typecheck` → 0 erreur sur les 4 workspaces (deux bugs de typage réels détectés et corrigés : export `RoleUtilisateur` type-only cassant son usage comme valeur ; `organization_id` manquant statiquement sur une création malgré l'injection runtime de l'extension tenant).
  - `npm run test:unit -w @batione/api` → **26/26 verts** (formatage MAD/téléphone marocain, logique d'injection tenant isolée sans DB). Un bug réel trouvé et corrigé en cours de route : `formatMAD` dépendait de `Intl.NumberFormat('fr-MA')`, dont le séparateur de milliers CLDR variait selon la version ICU du runtime — remplacé par une implémentation manuelle déterministe.
  - `npm run test:integration -w @batione/api` → **6/6 verts** contre PostgreSQL réel (Docker Compose local). Bug de sécurité réel trouvé et corrigé : `LoginDto` imposait `MinLength(8)` sur le mot de passe de connexion, ce qui permettait à un attaquant de contourner le compteur de verrouillage de compte en soumettant des mots de passe volontairement trop courts (rejetés en 400 avant d'atteindre `AuthService` et d'incrémenter `tentatives_echouees`) — contrainte retirée du DTO de connexion (elle reste sur l'inscription/création d'utilisateur).
  - `npm run test:security -w @batione/api` → **4/4 verts** contre PostgreSQL réel, deux organisations et deux utilisateurs distincts : liste d'utilisateurs cloisonnée, modification cross-tenant bloquée (404, jamais 200, ligne cible intacte en base), profil d'organisation toujours cohérent avec le tenant du jeton, jeton falsifié rejeté en 401.
  - `npm run build` → build de production réussi sur les 4 workspaces (Next.js : 5 routes statiques générées).
  - **Test manuel navigateur réel** (Browser pane) : inscription complète (Atlas Construction SARL) → connexion automatique → tableau de bord rendu avec checklist d'onboarding et KPIs à 0,00 MAD → rechargement de page avec perte du jeton en mémoire → session restaurée via le cookie de refresh sans ressaisie des identifiants. Aucune erreur console.
- **Non couvert à ce stade** (transparence explicite, cf. Règle Zéro) : RLS PostgreSQL (Couche 2), MFA, reset de mot de passe, invitation par email/WhatsApp, rotation JWT vers RS256/ES256, endpoints au-delà d'Organization/User (Chantiers, Finance, etc. — Phases 02+).

