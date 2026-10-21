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
| **2. Projets, Chantiers & Tâches** | ✅ Validé | 🔄 `Project` générique migré (sous-domaine BTP approfondi — Chantier/BPU/Décompte — pas encore ajouté) | 🔄 CRUD de base (liste filtrée+paginée, création avec code auto-généré, détail, archivage) — Tâches/Matériaux/Équipe/Matériel/Documents/Activité encore des onglets stubs | ⚠️ Vérifié manuellement en navigateur réel uniquement — **aucun test automatisé Jest écrit pour `ProjectsService`/`ProjectsController`** (dette à combler avant la suite) |
| **3. Clients, Marchés & Documents** | ✅ Validé | 🔄 `Client` générique migré (particulier/entreprise/entité publique, ICE/IF/RC/CNSS, conditions de paiement, limite de crédit) — Marchés/Devis/Factures/GED pas encore ajoutés | 🔄 CRUD de base (liste filtrée+paginée, sélecteur léger, création, détail avec projets liés, archivage) + `Project.client_id` remplace l'ancien texte libre `client_nom` | ⚠️ Vérifié manuellement en navigateur réel uniquement — **aucun test automatisé Jest écrit pour `ClientsService`/`ClientsController`** (même dette que Projets, cf. ligne 2) |
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

### 2026-10-20 : Intégration du Logo Officiel BatiOne
- **Assets de marque générés & intégrés** dans `apps/web/public/` :
  - `apps/web/public/brand/logo.png` : PNG haute résolution (512x512) transparent avec anti-aliasing sans halo et suppression des impuretés de trame.
  - `apps/web/public/brand/logo-full.jpg` : version carrée d'origine avec texture papier de luxe.
  - `apps/web/public/brand/logo-original.jpg` : image source brute (1024x1024).
  - `apps/web/public/favicon.ico` et `apple-touch-icon.png` : icônes pour onglets de navigateur et écrans d'accueil mobiles.
- **Composant UI `Logo` mis à jour** ([`Logo.tsx`](file:///Users/mohamedtazi/Desktop/ANTIGRAVITY%20FOLDER/BatiOne/apps/web/src/components/Logo.tsx)) :
  - Remplacement du SVG mockup temporaire par le monogramme officiel haute définition (Next.js `<Image>` optimisé avec `priority={true}` pour le LCP).
  - Support de l'orientation verticale (page de connexion) et horizontale, gestion du thème clair/sombre, et typographie bicolore ("Bati" encre, "One" or/ocre).
- **Vérifications exécutées** :
  - `npm run lint` → 0 erreur/avertissement.
  - `npm run typecheck` → 0 erreur TypeScript sur tous les workspaces.
  - `npm test` → 36/36 tests verts (5 suites de test).
  - `npm run build` → Build de production Next.js réussi (routes pré-rendues, static assets optimisés).

### 2026-10-20 : Harmonisation de la Palette de Marque avec le Logo
- **Mise à niveau des tokens de marque** ([`tokens.css`](file:///Users/mohamedtazi/Desktop/ANTIGRAVITY%20FOLDER/BatiOne/apps/web/src/styles/tokens.css)) :
  - Remplacement de l'orange générique (`#d97706`, `#b45309`, `#fef3c7`) par les teintes architecturales exactes extraites du logo :
    - `--batione-primary` : `#b0895d` (Or architectural / Sand Bronze du panneau central du monogramme).
    - `--batione-primary-strong` : `#8f6738` (Bronze profond pour survol, focus et contraste).
    - `--batione-primary-soft` : `#f7f0e4` (Voile crémeux subtil issu du papier texturé).
    - `--batione-primary-light` : `#c59e70` (Reflet doré architectural).
- **Harmonisation globale des composants UI** :
  - Boutons primaires (`.bo-btn--primary`), anneaux de focus des champs (`.bo-input:focus`), liens de navigation d'authentification (`/connexion`, `/inscription`), illustrations de chantier (`AuthBackground`, `ConstructionIllustration`), indicateurs de progression (`OnboardingChecklist`), icônes de topbar et états actifs de la sidebar.
  - En-tête de la barre latérale ([`Sidebar.tsx`](file:///Users/mohamedtazi/Desktop/ANTIGRAVITY%20FOLDER/BatiOne/apps/web/src/components/Sidebar.tsx)) mis à jour avec le monogramme officiel et le mot-symbole bicolore.
  - Page d'inscription ([`inscription/page.tsx`](file:///Users/mohamedtazi/Desktop/ANTIGRAVITY%20FOLDER/BatiOne/apps/web/src/app/inscription/page.tsx)) enrichie avec le logo de marque centré.
- **Vérifications exécutées** :
  - `npm run lint` → 0 erreur/avertissement.
  - `npm run typecheck` → 0 erreur TypeScript.
  - `npm test` → 36/36 tests automatisés verts.
  - `npm run build` → Build de production Next.js validé avec succès.

### 2026-10-21 : Correction Ports Dev (Phase 01) & Phase 02 — Module Projets (socle générique)
- **Bug réel corrigé — confusion de ports en développement local** : le frontend appelait silencieusement `localhost:3001` (ancien défaut codé en dur dans `lib/api.ts`) au lieu de `4001`, et l'API n'autorisait que l'origine CORS `3000` au lieu de `4000` — les deux ne fonctionnaient qu'avec des variables d'environnement shell passées manuellement, perdues au redémarrage. **4000/4001 sont déormais les ports par défaut persistés du projet** (choisis pour ne jamais entrer en collision avec un autre projet local sur cette machine) : `apps/web/.env.local` (nouveau, gitignored) fixe `NEXT_PUBLIC_API_URL`, `apps/web/package.json` et `apps/api/src/main.ts` ont leurs valeurs de repli par défaut alignées, `.env.example`/`README.md` mis à jour en conséquence.
- **Module Projets (Phase 02, socle générique multi-métiers)** : nouveau modèle `Project` migré (`type`/`statut` propres, distincts du cycle à 4 états des transactions financières — cf. commentaire du schéma), migration `20261021112314_add_project`. Endpoints `GET/POST /projets`, `GET/PATCH/DELETE /projets/:id` (`ProjectsModule` suivant exactement les conventions déjà établies par `OrganizationsModule`/`UsersModule` : `TenantPrismaService`, enveloppe de réponse standard, RBAC via `@Roles()`). Génération serveur du code projet (`PRJ-{année}-{séquence}`) avec retry sur collision (`P2002`).
- **Frontend** : restructuration en groupe de routes `(dashboard)` pour partager Sidebar/TopBar entre `/tableau-de-bord` et `/projets/*` sans dupliquer le layout ; nouveau hook `useMoi()` extrait pour factoriser la logique d'authentification/redirection déjà dupliquée. Pages `/projets` (liste avec recherche + filtre statut + état vide), `/projets/nouveau` (formulaire de création), `/projets/[id]` (fiche détail — onglet Aperçu fonctionnel, 7 onglets restants explicitement marqués "bientôt disponible", jamais simulés). Le tableau de bord affiche désormais le **nombre réel** de projets (plus de valeur statique) et son bouton "Créer un projet" est actif.
- **Vérification réellement exécutée** :
  - `npm run typecheck` / `npm run lint` → 0 erreur sur les 4 workspaces.
  - `npm run test:unit -w @batione/api` → 26/26 verts (inchangé — aucun nouveau test unitaire ajouté pour ce module, cf. dette notée dans le tableau §2).
  - **Test manuel navigateur réel** (Browser pane) : connexion → tableau de bord (0 projet) → `/projets` (état vide) → création d'un projet complet (nom, type, client, budget 850 000 MAD, aucune date) → redirection vers la fiche détail avec code `PRJ-2026-001` généré, statut `Brouillon`, budget formaté `850 000,00 MAD` → retour liste (ligne affichée avec toutes les colonnes) → tableau de bord (compteur passé à 1, état vide disparu). Requêtes réseau vérifiées une à une (`POST /projets → 201`, `GET /projets/:id → 200`, `GET /projets → 200`) — aucune erreur.
- **Non couvert à ce stade** : tests automatisés (unitaires/intégration/sécurité) pour le module Projets ; relation `client_nom` en texte libre plutôt qu'une vraie FK vers un futur modèle `Client` (Phase 03) ; onglets Financier/Tâches/Matériaux/Équipe/Matériel/Documents/Activité ; RLS PostgreSQL (toujours en attente depuis Phase 01).

### 2026-10-21 : Bug Critique Corrigé — Déconnexions Intempestives (Persistance de Session)
- **Symptôme signalé** : l'utilisateur était déconnecté en permanence pendant une utilisation normale (navigation entre deux pages), bien avant l'expiration légitime du jeton d'accès (15 min).
- **Trois bugs réels distincts identifiés et corrigés, par ordre de découverte** (méthode : instrumentation directe de `window.fetch` dans le navigateur réel pour obtenir la vérité terrain — les outils `read_network_requests`/`read_console_messages` du pane se sont révélés accumuler l'historique sur toute la durée de vie de l'onglet au lieu de le borner à la session de test en cours, ce qui a d'abord conduit à un faux diagnostic ; abandonné au profit de l'instrumentation directe) :
  1. **Aucun rafraîchissement automatique n'existait** : `lib/api.ts` ne faisait ni rafraîchissement proactif en arrière-plan, ni nouvelle tentative silencieuse sur un 401 — la moindre expiration du jeton d'accès déclenchait une redirection immédiate vers `/connexion`, même si le cookie de rafraîchissement httpOnly était parfaitement valide.
  2. **État de session dupliqué entre chunks de pages (suspecté, partiellement vérifié)** : en mode développement, Next.js/webpack peut regrouper un même module (`lib/api.ts`) séparément dans chaque chunk de page plutôt que dans un chunk partagé — déplacé par précaution vers un singleton réel sur `window` plutôt qu'une variable de module (`let`), immunisé contre ce découpage quel que soit le bundling.
  3. **Cause racine réelle, confirmée par preuve d'exécution** : `NEXT_PUBLIC_API_URL` avait été fixé en dur sur l'IP locale (`192.168.1.16`) pour permettre l'accès depuis un téléphone (cf. entrée précédente), alors que l'application était testée via `localhost:4000`. Le cookie de rafraîchissement est `SameSite=Lax` — le navigateur traite `localhost` et `192.168.1.16` comme deux sites différents et **n'envoie jamais le cookie sur une requête cross-site**, donc `POST /auth/rafraichir` échouait systématiquement en 401, quelle que soit la validité réelle de la session. **Corrigé en dérivant l'hôte de l'API depuis `window.location.hostname` à l'exécution** (`apps/web/src/lib/api.ts::resolveApiBaseUrl`) au lieu d'une URL figée à la compilation — l'API suit désormais automatiquement l'hôte utilisé pour charger la page (localhost, IP locale, téléphone), donc toujours même-site avec le cookie.
- **Vérification réellement exécutée (pas une affirmation)** : `JWT_ACCESS_TTL` abaissé temporairement à `8s` pour forcer l'expiration rapidement, testé en navigateur réel avec `window.fetch` instrumenté pour obtenir un journal d'appels fiable :
  - **Avant le correctif #3** : `POST /auth/rafraichir` → `401` systématique vers `192.168.1.16:4001` depuis une page chargée sur `localhost:4000` ; redirection vers `/connexion` en quelques secondes malgré un cookie de session valide.
  - **Après le correctif #3** : connexion → attente de 25+ secondes (plus de 3× la durée de vie du jeton de 8s) → 4 rafraîchissements automatiques enchaînés avec succès (`201 Created` à chaque fois, toutes les ~7s) → navigation vers `/projets` toujours fonctionnelle, aucune redirection, aucune erreur 401.
  - `JWT_ACCESS_TTL` restauré à `15m` ; connexion re-testée manuellement pour confirmer l'absence de régression sur le flux normal.
  - `npm run typecheck` / `npm run lint` → 0 erreur sur `@batione/web`.
- **Non couvert à ce stade** : test automatisé (Jest/E2E) reproduisant ce scénario — seule une vérification manuelle en navigateur réel existe pour l'instant ; le point #2 (duplication de module) n'a pas été confirmé de façon isolée comme cause contributive réelle (le correctif est conservé par principe de robustesse, sans preuve qu'il était strictement nécessaire une fois le point #3 corrigé).

### 2026-10-21 : Module Clients (Phase 03, socle) — `Project.client_id` remplace le texte libre
- **Modèle `Client`** migré (`add_client`, après nettoyage d'une ligne de test portant l'ancien `client_nom` — perte de donnée acceptée car purement une valeur de démo locale, jamais de production) : type (particulier/entreprise/entité publique), contact, coordonnées, ICE/IF/RC/CNSS, conditions de paiement, limite de crédit, notes, soft delete + champs d'audit standard.
- **`Project.client_nom` (texte libre) supprimé et remplacé par `Project.client_id`** (FK réelle vers `Client`) — referme la dette explicitement notée depuis la Phase 02. Recherche de projets par nom de client désormais faite via la relation (`client: { nom: { contains } }`), plus sur un champ texte dupliqué.
- **Backend `ClientsModule`** : mêmes conventions strictes que `ProjectsModule`/`OrganizationsModule`/`UsersModule` (`TenantPrismaService`, enveloppe de réponse standard, RBAC `@Roles()`). Endpoint léger `GET /clients/selection` (id+nom+type, non paginé) dédié à l'alimentation d'un sélecteur, distinct de `GET /clients` qui reste paginé/filtré. Unicité de l'ICE vérifiée à la création, mais scopée au tenant (deux organisations différentes peuvent légitimement partager un même client final, donc un même ICE enregistré chacune de leur côté) — jamais une contrainte globale.
- **Frontend** : `/clients` (liste + recherche + filtre type + état vide), `/clients/nouveau` (formulaire), `/clients/[id]` (fiche — coordonnées, ICE/IF/RC si renseignés, solde placeholder honnête "arrivera avec le module Finance", liste des projets liés avec lien direct). `/projets/nouveau` et la fiche projet utilisent désormais un vrai sélecteur de client (peuplé par `/clients/selection`) au lieu d'un champ texte libre ; le nom du client sur la fiche projet est un lien cliquable vers sa fiche.
- **Incident d'infrastructure traité en cours de route (hors code)** : le démon Docker s'est retrouvé bloqué/en crash-loop pendant ce travail — cause racine identifiée : disque quasi plein (6,3 Go libres sur 228 Go, dont 17 Go rien que pour le disque virtuel Docker). `open -a Docker` seul ne suffisait pas à le réparer : le GUI était relancé mais les processus `com.docker.backend` restaient les mêmes PID bloqués depuis le lancement initial (pas de redémarrage réel). Résolu par : purge du cache npm (4,1 Go, sans risque) + cache Homebrew, puis arrêt forcé complet de tous les processus Docker (`pkill -9`) suivi d'un relancement propre — le processus `com.docker.virtualization` (démarrage du noyau de la VM) n'apparaissait qu'après ce traitement complet, confirmant qu'il ne s'agissait pas d'un simple temps de démarrage long mais d'un blocage réel nécessitant un arrêt forcé.
- **Vérification réellement exécutée** :
  - `npm run typecheck` / `npm run lint` → 0 erreur sur les 4 workspaces.
  - `npm test -w @batione/api` → 36/36 verts (inchangé — aucun nouveau test automatisé pour ce module, dette identique à celle du module Projets).
  - **Test manuel navigateur réel**, sur un onglet propre dédié à la vérification finale (pour éviter la confusion observée plus tôt dans la session avec l'historique de console/réseau accumulé sur un onglet de longue durée) : création du client "Famille Benjelloun" (particulier, téléphone, ville) → fiche détail correcte ("Projets (0)") → création d'un projet "Villa Anfa Supérieur" avec ce client sélectionné dans le menu déroulant → fiche projet affichant le client en lien cliquable → clic → retour sur la fiche client, désormais "Projets (1)" avec le bon projet listé → liste `/projets` affichant correctement le nom du client dans sa colonne → recherche "Benjelloun" dans la liste des projets ne retournant que le projet concerné (confirme la recherche par relation, pas par un champ texte fantôme). Console vérifiée sur un onglet frais : aucune erreur réelle (les 401 observés sont le comportement attendu de la première tentative sans jeton avant rafraîchissement).
