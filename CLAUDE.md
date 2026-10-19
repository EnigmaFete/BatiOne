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

1. **Périmètre Financier** : Suivi des coûts réels de chantier vs budget (Job Costing). Pas de comptabilité générale statutaire.
2. **Gestion du Stock** : Sorties supérieures à la quantité disponible strictement **interdites** (`STOCK_INSUFFISANT`). Pas de stock négatif.
3. **Cycle des Enregistrements Sensibles** :
   `brouillon` (draft) ➔ `soumis` (submitted) ➔ `approuvé` (approved) ➔ `enregistré` (recorded).
   Toute transaction à l'état `enregistré` est scellée et immuable ; seule une **extourne contrôlée** (contre-passation symétrique motivée) peut annuler son impact.
4. **Multi-Tenancy** : Tout appel et toute requête en base doivent être filtrés par `organization_id`.
5. **Monnaie & Précision** : Dirham Marocain (`MAD`). Montants manipulés en centimes entiers ou `Prisma.Decimal` haute précision pour éliminer tout arrondi erroné.
