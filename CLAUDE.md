# CLAUDE.md — Guide Rapide & Commandes de Développement

## Vue d'Ensemble
BatiOne est une solution SaaS cloud multi-tenant de gestion de chantier et de contrôle des coûts (Job-Costing) pour les entreprises BTP au Maroc.
- **Frontend** : Next.js + React + TypeScript
- **Backend** : NestJS + TypeScript
- **ORM & DB** : Prisma ORM + PostgreSQL
- **Langue** : Français d'abord (French-first), architecture prête pour la localisation (i18n)

---

## Commandes Essentielles

### Développement
```bash
# Lancement de l'environnement de développement complet
npm run dev

# Lancement du backend NestJS uniquement
npm run dev:server   # ou cd apps/api && npm run start:dev

# Lancement du frontend Next.js uniquement
npm run dev:client   # ou cd apps/web && npm run dev

# Vérification du typage statique
npm run typecheck

# Analyse linter (ESLint)
npm run lint
```

### Base de Données & Migrations (Prisma)
```bash
# Génération du client Prisma
npx prisma generate

# Création et application d'une nouvelle migration
npx prisma migrate dev --name <nom_migration>

# Déploiement des migrations en environnement de test/prod
npx prisma migrate deploy

# Lancement du visualiseur de base de données
npx prisma studio

# Réinitialisation et réensemencement des données de démo
npx prisma migrate reset
```

### Tests Automatisés
> ⚠️ **Règle absolue** : Ne jamais déclarer qu'un test est validé sans avoir effectivement lancé la commande et vérifié la réussite.

```bash
# Exécution de l'ensemble des tests
npm test

# Exécution des tests unitaires (calculs financiers, logique de stock)
npm run test:unit

# Exécution des tests d'intégration API
npm run test:integration

# Exécution des tests de sécurité et d'isolation multi-tenant
npm run test:security

# Couverture de test
npm run test:cov
```

---

## Règles d'Architecture Inviolables

1. **Périmètre Financier** : Suivi des coûts réels de chantier vs budget (Job Costing). Pas de comptabilité générale statutaire — aucune conformité comptable légale n'est revendiquée.
2. **Gestion du Stock** : Sorties supérieures à la quantité disponible strictement **interdites** (`STOCK_INSUFFISANT`). Mise à jour conditionnelle atomique (`UPDATE ... WHERE quantite_disponible >= :q`) + contrainte `CHECK` en base comme filet de sécurité final. Multi-lignes = tout ou rien. Pas de fonctionnalité de réservation en v1.
3. **Cycle des Enregistrements Sensibles** :
   `brouillon` (draft) ➔ `soumis` (submitted) ➔ `approuvé` (approved) ➔ `enregistré` (recorded), avec rejet possible `soumis` ➔ `brouillon` (motif obligatoire).
   Toute transaction à l'état `enregistré` est scellée et immuable ; seule une **extourne contrôlée** (contre-passation symétrique motivée, unique, réservée aux enregistrements `ENREGISTRE`) peut annuler son impact. Un décompte ne peut être extourné tant qu'un décompte ultérieur du même chantier reste `ENREGISTRE`. Le même utilisateur ne peut pas soumettre **et** approuver la même opération.
4. **Multi-Tenancy** : Tout appel et toute requête en base doivent être filtrés par `organization_id`, dérivé uniquement du JWT authentifié (jamais d'un en-tête client). Isolation à deux couches : extension Prisma (toutes opérations, y compris `update`/`delete`) + PostgreSQL Row-Level Security en défense en profondeur. Le rôle DB applicatif standard n'a jamais `BYPASSRLS`.
5. **Monnaie & Précision** : Dirham Marocain (`MAD`). Montants exclusivement en `Prisma.Decimal` / SQL `DECIMAL(14,2)` — les centimes entiers sont explicitement écartés (aucune ambiguïté). Fuseau horaire métier : `Africa/Casablanca` (dates calendaires) ; horodatages stockés en UTC (`timestamptz`).
6. **Idempotence** : les écritures rejouables (sorties de stock, pointages, dépenses, acomptes) exigent un en-tête `Idempotency-Key` ; même clé + même requête ⇒ même résultat renvoyé sans duplication ; même clé + requête différente ⇒ `409 IDEMPOTENCY_KEY_CONFLICT`.
