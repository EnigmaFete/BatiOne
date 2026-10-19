# ARCHITECTURE.md — Architecture Système & Blueprint Technique

## 1. Principes d'Architecture & Décisions Structurantes
BatiOne est conçu selon une architecture moderne, modulaire et hautement disponible, pensée pour concilier la réactivité d'une application de bureau pour les directions et la résilience hors-ligne d'un outil mobile de chantier.

- **Langue & Localisation** : Conçu en français par défaut (*French-first*), prêt pour l'internationalisation (*i18n-ready*) avec `next-intl` côté client et catalogue de messages d'erreurs traduisibles côté NestJS.
- **Approche Multi-Tenant** : Mutualisation de la base de données avec isolation logique stricte par ligne (`organization_id`) garantie au niveau de l'ORM Prisma.
- **Intégrité Opérationnelle** :
  - Cycle des documents sensibles en 4 états (`brouillon` ➔ `soumis` ➔ `approuvé` ➔ `enregistré`).
  - Immutabilité des transactions enregistrées et gestion des contre-passations (extournes).
  - Blocage transactionnel strict de toute sortie de stock excédentaire.

---

## 2. Pile Technologique (Tech Stack)

```mermaid
graph TD
    subgraph Frontend [Applications Web & Mobiles - Next.js]
        UI1[Next.js App Router + React + TypeScript]
        UI2[TailwindCSS + Design Tokens BTP]
        UI3[TanStack Query + Cache Local IndexedDB]
        UI4[next-intl - Localisation FR / AR / EN]
    end

    subgraph Backend [Serveur API - NestJS]
        API1[NestJS Modular Monolith]
        API2[Guards Auth JWT & Intercepteur Multi-Tenant]
        API3[State Machine Engine - 4 États & Extournes]
        API4[Stock Transaction Manager - Atomic Locks]
        API5[PDF Generation Engine - Décomptes & Bons]
    end

    subgraph Data [Persistance & Stockage]
        DB[(PostgreSQL - Primary Database)]
        ORM[Prisma ORM avec Client Extensions]
        S3[Stockage Objets S3 / MinIO - GED & Photos]
        CACHE[(Redis - Cache de sessions & files d'attente)]
    end

    UI1 -->|REST API / JSON| API1
    UI3 -.->|Synchronisation Différée| API1
    API1 --> API2
    API2 --> API3
    API2 --> API4
    API3 --> ORM
    API4 --> ORM
    ORM --> DB
    API1 --> CACHE
    API5 --> S3
```

| Composant | Technologie Choisie | Rôle & Justification |
| :--- | :--- | :--- |
| **Frontend Web / Mobile** | **Next.js 14+ / React 18+ / TypeScript** | Performance SSR/SSG pour les dashboards, réactivité SPA pour les formulaires de saisie, PWA pour les chantiers. |
| **Gestion d'État & Sync** | **TanStack Query + Zustand** | Cache robuste, rafraîchissement d'arrière-plan et gestion de la file d'attente hors-ligne. |
| **Backend API** | **NestJS + TypeScript** | Architecture d'entreprise modulaire (Modules, Controllers, Services), injection de dépendances, robustesse et typage de bout en bout. |
| **ORM & Typage DB** | **Prisma ORM** | Typage strict généré à partir du schéma, migrations déterministes, extensions de client pour l'injection automatique du tenant. |
| **Base de Données** | **PostgreSQL 15+** | Robustesse ACID éprouvée, support du verrouillage transactionnel (`SELECT ... FOR UPDATE`), calculs décimaux exacts et colonnes JSONB. |
| **Stockage Documents** | **AWS S3 / Cloudflare R2 / MinIO** | Stockage sécurisé des pièces justificatives de chantier, photos horodatées et PDF générés. |
| **Génération PDF** | **PDFKit / Puppeteer** | Rendu déterministe côté serveur des documents officiels BTP (Décomptes, BPU, Bons de Commande). |

---

## 3. Structure Monorepo Recommandée

```
BatiOne/
├── apps/
│   ├── api/                   # Backend NestJS
│   │   ├── src/
│   │   │   ├── common/        # Decorators, Filters, Interceptors, Guards
│   │   │   ├── modules/       # 9 modules métier
│   │   │   │   ├── auth/
│   │   │   │   ├── organizations/
│   │   │   │   ├── chantiers/
│   │   │   │   ├── clients/
│   │   │   │   ├── devis-decomptes/
│   │   │   │   ├── depenses-finances/
│   │   │   │   ├── stock-achats/
│   │   │   │   ├── main-doeuvre/
│   │   │   │   ├── engins-materiel/
│   │   │   │   ├── ecritures-consolidees/
│   │   │   │   └── dashboard/
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   └── test/              # Tests d'intégration et E2E
│   └── web/                   # Frontend Next.js
│       ├── src/
│       │   ├── app/           # Routes App Router (FR par défaut)
│       │   ├── components/    # Composants graphiques réutilisables
│       │   ├── hooks/         # Hooks React & gestion offline
│       │   ├── lib/           # Utilitaires (formatage MAD, devises, dates)
│       │   └── messages/      # Fichiers de localisation i18n (fr.json, ar.json)
├── packages/
│   ├── database/              # Schéma Prisma, migrations et client étendu
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/index.ts
│   └── shared-types/          # DTOs partagés, Enums et types communs
├── docs/                      # Documentation vivante et spécifications
├── AGENTS.md                  # Manuel d'opération des agents IA
├── CLAUDE.md                  # Commandes et aide-mémoire Claude
└── package.json               # Configuration workspace
```

---

## 4. Motifs d'Architecture Clés

### 4.1. Isolation Multi-Tenant à Deux Couches (Décision D10/D14 — ADR-005 révisé)

> **Statut** : décision d'architecture approuvée. Le code ci-dessous est une **spécification** de l'extension Prisma corrigée, pas une implémentation vérifiée — aucun test n'a été exécuté à ce stade documentaire (cf. AGENTS.md §2.1).

Le contexte tenant (`organizationId`) est dérivé **exclusivement** de l'appartenance d'organisation vérifiée dans le JWT authentifié. Un en-tête `X-Tenant-ID` fourni par le client n'est **jamais** une source d'autorité tenant (cf. ADR-017) ; s'il est présent, la requête est rejetée (`400 TENANT_HEADER_NOT_ALLOWED`) avant d'atteindre la couche de données.

**Couche 1 — Extension Prisma (toutes opérations, y compris update/delete) :**

```typescript
// packages/database/src/tenantClient.ts
export const createTenantPrismaClient = (prisma: PrismaClient, organizationId: string) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenantExemptModels = ['Organization']; // SuperAdmin n'est PAS un modèle : c'est une valeur de l'enum RoleUtilisateur sur User
          if (!tenantExemptModels.includes(model)) {
            if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'].includes(operation)) {
              args.where = { ...args.where, organization_id: organizationId };
            }
            if (operation === 'create') {
              if (args.data) args.data.organization_id = organizationId;
              // Note : les écritures imbriquées (ex. chantier.create({ data: { lots: { create: [...] } } }))
              // ne sont PAS couvertes automatiquement — le service appelant DOIT fixer organization_id
              // explicitement sur chaque création imbriquée. Voir le test d'écriture inter-tenant (TEST_STRATEGY §3.3).
            }
            if (['update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
              // Correctif critique : le filtre tenant doit être fusionné dans WHERE, pas dans DATA.
              // L'ancienne version de cette extension injectait organization_id dans args.data pour
              // update/delete, ce qui ne restreint JAMAIS la ligne cible — faille d'IDOR inter-tenant.
              args.where = { ...args.where, organization_id: organizationId };
            }
          }
          return query(args);
        },
      },
    },
  });
};
```

**Couche 2 — PostgreSQL Row-Level Security (défense en profondeur, indépendante de la couche 1) :**
- `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;` + `CREATE POLICY tenant_isolation ON <table> USING (organization_id = current_setting('app.current_org_id')::uuid);` sur **chaque** table tenant.
- Le `TenantGuard` NestJS exécute `SET LOCAL app.current_org_id = $1` en tout début de la transaction de requête, avant toute lecture/écriture.
- Sécurité de pool de connexions : `SET LOCAL` est scope à la transaction PostgreSQL courante et ne fuite pas vers une connexion réutilisée par une autre requête, à condition que chaque requête HTTP s'exécute dans sa propre transaction explicite (jamais de session partagée entre requêtes).
- Le rôle de connexion utilisé par le pool applicatif standard **n'a pas** `BYPASSRLS`, ni `SUPERUSER`. Un rôle distinct, réservé aux accès privilégiés SUPERADMIN et aux migrations, porte `BYPASSRLS` et n'est jamais utilisé par le chemin de requête normal (cf. `SECURITY_MODEL.md` §9).
- Ni la couche 1 ni la couche 2 ne remplace l'autre : la couche 1 donne des erreurs métier précises (404/403) côté application, la couche 2 garantit qu'un oubli applicatif ne produit jamais une fuite réelle en base.
- **Portée restante hors du présent document** : l'activation effective des policies RLS, la revue de sécurité indépendante de leur configuration, et les tests de contournement font partie de la phase d'implémentation (cf. ROADMAP.md Phase 01).

### 4.2. Invariant de Stock Transactionnel (Décision D8/D9 — ADR-002 révisé)

> **Statut** : décision d'architecture approuvée, remplaçant le mécanisme précédemment décrit ("verrou pessimiste ou isolation sérialisable") qui n'était ni spécifié de façon exécutable ni testé contre de vraies connexions concurrentes. Le mécanisme ci-dessous est une spécification ; aucun test n'a été exécuté à ce stade documentaire.

**Mécanisme retenu : mise à jour conditionnelle atomique en une seule instruction SQL**, pas de verrou explicite (`FOR UPDATE`) ni d'isolation `SERIALIZABLE` — la condition `WHERE quantite_disponible >= :quantite` rend la vérification et la décrémentation indivisibles au niveau de l'instruction, garanti par PostgreSQL quel que soit le niveau d'isolation de la transaction. Pour un Bon de Sortie multi-lignes, chaque ligne applique ce motif, et **l'ensemble des lignes réussit ou échoue atomiquement** dans une unique transaction interactive Prisma (rollback total si une seule ligne échoue — aucune décrémentation partielle ne doit survivre).

```typescript
// modules/stock/stock.service.ts
async enregistrerSortieStock(dto: CreerSortieStockDto, orgId: string, idempotencyKey: string) {
  return this.prisma.$transaction(async (tx) => {
    // 0. Idempotence : même clé déjà traitée ⇒ retourner le résultat original sans rejouer (cf. §6)
    const existant = await tx.bonSortie.findUnique({
      where: { organization_id_idempotency_key: { organization_id: orgId, idempotency_key: idempotencyKey } },
    });
    if (existant) return existant;

    for (const ligne of dto.lignes) {
      // 1. Mise à jour conditionnelle atomique : la clause WHERE rend le contrôle et la
      //    décrémentation indivisibles — pas de lecture séparée suivie d'une écriture.
      const resultat = await tx.$executeRaw`
        UPDATE "StockMagasin"
        SET quantite_disponible = quantite_disponible - ${ligne.quantite}
        WHERE organization_id = ${orgId}
          AND magasin_id = ${dto.magasinId}
          AND article_id = ${ligne.articleId}
          AND quantite_disponible >= ${ligne.quantite}
      `;

      if (resultat === 0) {
        // 2. Échec : soit le stock est insuffisant, soit la ligne n'existe pas — ré-interroger
        //    pour produire un message d'erreur précis. La transaction entière est annulée (rollback).
        const stockActuel = await tx.stockMagasin.findUnique({
          where: { organization_id_magasin_id_article_id: { organization_id: orgId, magasin_id: dto.magasinId, article_id: ligne.articleId } },
        });
        throw new BadRequestException({
          code: 'STOCK_INSUFFISANT',
          message: `Quantité disponible (${stockActuel?.quantite_disponible ?? 0}) inférieure à la demande (${ligne.quantite}).`,
        });
      }

      // 3. Créer le mouvement scellé (dérivé du Bon de Sortie, sans cycle d'approbation propre — cf. §4.3)
      await tx.mouvementStock.create({
        data: { organization_id: orgId, type_mouvement: 'SORTIE_CHANTIER', quantite: ligne.quantite, chantier_id: dto.chantierId, statut: 'ENREGISTRE' },
      });
    }

    return tx.bonSortie.create({ data: { organization_id: orgId, idempotency_key: idempotencyKey, /* ... */ } });
  });
}
```

**Filet de sécurité base de données (indépendant de la couche applicative)** : contrainte `CHECK` sur `StockMagasin.quantite_disponible >= 0`. Le langage de schéma Prisma utilisé dans ce dépôt ne génère pas cette contrainte automatiquement — elle doit être ajoutée via une migration SQL manuelle (`ALTER TABLE "StockMagasin" ADD CONSTRAINT quantite_non_negative CHECK (quantite_disponible >= 0);`), documentée explicitement dans la migration correspondante.

**Fonctionnalité de réservation (`quantite_reservee`) retirée du périmètre v1** (décision D9) : la disponibilité se lit directement sur `quantite_disponible`, sans champ intermédiaire. Une réservation de stock pourra être proposée comme fonctionnalité séparément cadrée dans une phase ultérieure si un besoin concret de contention multi-équipes est constaté.

### 4.3. Machine d'États & Extourne Contrôlée (Décisions D4, D5, D6 — ADR-003 révisé)
Les services NestJS appliquent une matrice de transition stricte :
- Transitions autorisées : `BROUILLON` ➔ `SOUMIS` ➔ `APPROUVE` ➔ `ENREGISTRE`, et `SOUMIS` ➔ `BROUILLON` (rejet motivé, via `POST /:module/:id/rejeter`, cf. `API_CONTRACTS.md` §2).
- **Séparation des tâches (D4)** : le `user_id` ayant exécuté `soumettre` sur un enregistrement ne peut pas exécuter `approuver` sur ce même enregistrement — vérification serveur obligatoire, indépendante du rôle RBAC. Le routage hiérarchique complet (délégation par supérieur désigné) est **hors périmètre v1** ; cette règle simple d'auto-approbation est le seul garde-fou exigé pour l'instant.
- Tout enregistrement `ENREGISTRE` est **immuable** : aucune mutation directe des colonnes n'est permise par la couche service, quel que soit le rôle appelant.
- **Extourne — sémantique précise (D5, D6)** :
  - L'enregistrement d'origine **reste `ENREGISTRE` pour toujours** ; l'extourne crée une **nouvelle ligne** portant `statut = EXTOURNE` et `extourne_de_id` pointant vers l'original. Ce n'est jamais une mutation de l'original.
  - Préconditions obligatoires avant d'autoriser `creerExtourne(id, motif)` : (a) l'enregistrement cible est à l'état `ENREGISTRE` (sinon `STATUT_INVALIDE_POUR_EXTOURNE`) ; (b) l'enregistrement cible n'a pas déjà d'extourne associée — contrainte d'unicité `extourne_de_id` (sinon `DEJA_EXTOURNE`) ; (c) **pour un `Decompte`** spécifiquement : aucun décompte de numéro supérieur sur le même chantier n'est encore `ENREGISTRE` (sinon `EXTOURNE_BLOQUEE_DECOMPTE_ULTERIEUR`) — les décomptes se reversent strictement dans l'ordre chronologique inverse, jamais en sautant un numéro intermédiaire, parce que `cumul_precedent_ht`/`cumul_total_ht` de chaque décompte dépendent du précédent et ne sont **jamais recalculés rétroactivement**.
  - **Chantier en état terminal** (`RECEPTION_DEFINITIVE`, `CLOTURE`) : une extourne y reste possible uniquement via le rôle `ORG_ADMIN`, avec un motif obligatoire et une entrée `PisteAudit` dédiée signalant le dépassement d'état terminal. Ce n'est pas un blocage absolu — une correction légitime peut survenir après clôture — mais elle exige l'autorité la plus élevée et une trace explicite.
  - Aucun recalcul silencieux : une extourne ne modifie jamais les montants stockés des documents historiques déjà émis ; elle n'affecte que le solde courant via la nouvelle ligne `EXTOURNE`.
- **Documents dérivés sans cycle propre** : `MouvementStock` et `EcritureConsolidee` naissent directement à l'état `ENREGISTRE` (cf. `DATABASE_SCHEMA.md`) parce qu'ils sont des écritures de grand livre **générées automatiquement** en conséquence de la transition `ENREGISTRE` de leur document parent (`BonSortie`, `Decompte`, `Depense`, `Pointage`). Ils n'ont pas de revue indépendante — leur "approbation" est entièrement héritée de celle du document parent — et ne sont réversibles que via l'extourne du parent, jamais directement.

---

## 5. Fuseaux Horaires & Dates Métier

- **Instants** (`created_at`, `updated_at`, horodatages d'audit) : stockés en UTC (`timestamptz` — mapping par défaut du type Prisma `DateTime`). Jamais de décalage local appliqué au stockage.
- **Dates calendaires métier** (`date_sortie`, `date_pointage`, `date_journal`, `periode_debut`/`periode_fin`, déjà typées `@db.Date` dans le schéma) : interprétées dans le fuseau `Africa/Casablanca` pour déterminer "à quel jour ouvré ce fait appartient" — un pointage saisi à 23h50 heure locale est rattaché à cette journée locale, jamais décalé par une conversion UTC naïve.
- Locale par défaut : `fr-MA`. Devise : `MAD`, toujours affichée avec le symbole/format marocain dans l'UI.
- **Point d'attention documenté (pas une hypothèse silencieuse)** : le Maroc a un historique de changements d'heure irrégulier (UTC+1 permanent depuis 2018, avec des périodes de retour à UTC+0 pendant le Ramadan certaines années). La base `tzdata` utilisée par PostgreSQL et par le runtime Node doit être tenue à jour et sa version vérifiée lors de chaque mise à niveau d'infrastructure — ne pas supposer que `Africa/Casablanca` est un fuseau fixe et immuable dans le temps.
- **Statut** : politique documentée. Le test de limite DST (soumission près de minuit local à une date de transition) est spécifié dans `TEST_STRATEGY.md` §3.6 mais non exécuté à ce stade.

## 6. Idempotence des Écritures Sensibles

- **Portée** : toute écriture rejouable à risque de duplication — `BonSortie`, `Pointage`, `Depense`, `AcompteOuvrier` — exige un en-tête `Idempotency-Key` (UUID généré côté client) sur la requête `POST` de création.
- **Contrat** :
  - Même clé + requête équivalente ⇒ le serveur renvoie le résultat de l'opération d'origine (HTTP 200), sans créer de second enregistrement ni rejouer l'effet métier (décrémentation de stock, écriture consolidée, etc.).
  - Même clé + corps de requête différent ⇒ rejet `409 IDEMPOTENCY_KEY_CONFLICT`, l'opération d'origine n'est pas modifiée.
  - Portée tenant : la clé est unique par `(organization_id, idempotency_key)`, jamais globale — deux organisations peuvent réutiliser la même valeur de clé sans collision.
  - Tentatives concurrentes avec la même clé : la seconde requête, si elle arrive avant que la première n'ait terminé, doit attendre ou être rejetée de façon déterministe (verrou applicatif sur la clé ou contrainte d'unicité exploitée en "upsert sous contrainte") — jamais une double exécution.
  - **Durée de conservation : 24 heures — valeur proposée, non confirmée comme définitive.** Au-delà, une requête rejouée avec la même clé peut être traitée comme une nouvelle opération. Cette durée reste à valider explicitement avant la phase d'implémentation.
  - Comportement après échec : si l'opération d'origine a échoué (ex. `STOCK_INSUFFISANT`), la clé n'est pas considérée comme "consommée" avec succès — une nouvelle tentative avec la même clé peut retenter l'opération tant que la fenêtre de conservation n'est pas expirée.
- **Statut** : contrat documenté. Non implémenté, non testé à ce stade.

## 7. Gestion des Secrets

- **Développement** : secrets dans `.env.local` (non suivi par Git — déjà couvert par `.gitignore`, cf. `PHASE_00.md`). Un fichier `.env.example` committé contient uniquement des espaces réservés (`DATABASE_URL=postgresql://user:password@localhost:5432/batione`), jamais de valeur réelle.
- **CI** : secrets exclusivement via le coffre-fort chiffré natif de la plateforme CI (GitHub Actions Secrets, le dépôt étant hébergé sur GitHub). Aucun secret dans un fichier de configuration suivi.
- **Production** : le mécanisme de stockage dépend du choix d'hébergement, **non encore arrêté** (cf. `DECISIONS.md` ADR-016) — cette section reste donc neutre vis-à-vis du fournisseur. Signature JWT : recommandé en `RS256`/`ES256` (clé publique de vérification distribuable sans exposer la clé de signature) plutôt qu'`HS256` — à confirmer lors du choix définitif.
- **Rotation & incident** : rotation des identifiants (base de données, stockage objet) recommandée tous les 90 jours ; une procédure de réponse à incident (fuite de secret) doit exister avant la mise en production — non rédigée à ce stade, signalée comme dépendance de la phase d'implémentation de sécurité.
- **Statut** : politique documentée, aucune procédure revendiquée comme implémentée.

## 8. Migrations & Reprise après Sinistre (Provisoire)

- **Migrations** : toute migration Prisma doit préciser dans sa description (PR) : (a) sa compatibilité ascendante (colonnes additives/nullables en premier, jamais un renommage direct — motif ajout ➔ bascule applicative ➔ suppression de l'ancienne colonne) ; (b) un plan de retour arrière écrit — Prisma ne génère pas de migration descendante automatique, donc **une migration ne doit jamais être qualifiée de "réversible automatiquement" sans un mécanisme de rollback vérifié** ; (c) si la migration touche une table en production contenant des lignes, une sauvegarde préalable est requise avant application.
- **Opérations DDL non transactionnelles** (ex. `CREATE INDEX CONCURRENTLY`) : ne peuvent pas s'exécuter dans la transaction implicite de la migration — nécessitent une procédure de reprise manuelle documentée séparément, car un échec partiel y est réellement possible (contrairement à une migration transactionnelle standard qui s'annule intégralement en cas d'erreur).
- **Sauvegarde & restauration (cibles provisoires, non engageantes)** : objectifs proposés **RPO ≤ 15 minutes / RTO ≤ 4 heures** pour la production. Ces cibles **dépendent du choix d'hébergement, du coût accepté, de l'architecture de sauvegarde retenue et d'une validation de restauration réelle** — elles ne deviennent des engagements opérationnels qu'une fois ces quatre conditions réunies. Aucun système de sauvegarde ni exercice de restauration n'existe à ce jour.
- **Exigences opérationnelles à couvrir avant mise en production** (hors périmètre du présent cadrage documentaire) : rétention des sauvegardes, stockage protégé (chiffrement, versioning sur le stockage objet GED), procédure de restauration testée, supervision des sauvegardes, et désignation d'un responsable opérationnel de la reprise après sinistre.
- **Statut** : cadrage documentaire uniquement. Voir `docs/OPERATIONS.md` pour le détail procédural et `DECISIONS.md` ADR-016.
