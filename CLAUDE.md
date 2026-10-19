# CLAUDE.md — Assistant Quick Reference & Commands

## Overview
BatiOne is a construction management and job-costing ERP platform tailored for BTP (Bâtiment et Travaux Publics) companies in Morocco.

---

## Essential Commands

### Development
```bash
# Start local development server
npm run dev

# Start backend server (if separated)
npm run dev:server

# Run all linters
npm run lint

# Run type checker
npm run typecheck
```

### Testing
```bash
# Run entire test suite
npm test

# Run tests in watch mode
npm run test:watch

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run security & tenant isolation checks
npm run test:security
```

### Build & Deploy
```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

### Database & Migrations
```bash
# Run database migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Seed demo data for local development
npm run db:seed
```

---

## Architectural Guardrails

1. **Multi-Tenancy**: Every database table with client data MUST include `organization_id` or `tenant_id`. Every SQL query MUST filter by tenant.
2. **Moroccan Currency & Tax**:
   - Currency: Moroccan Dirham (`MAD` / `DH`).
   - Store monetary values in centimes (integers) or `DECIMAL(14, 2)` to eliminate floating-point arithmetic errors.
   - Standard VAT (TVA) rates: `20%` (general works), `14%` (certain transport/equipment), `10%`, `7%`, `0%` (exemptions).
   - Support Retenue de Garantie (typically 5% or 10%) on construction décomptes.
3. **Roles & Permissions**:
   - `SUPERADMIN`: Platform management
   - `ORG_ADMIN`: Construction company executive (Directeur Général)
   - `CONDUCTEUR_TRAVAUX`: Project/Operations Director managing multiple sites
   - `CHEF_CHANTIER`: On-site supervisor (pointage, daily logs, reception of materials)
   - `DAF_COMPTABLE`: Financial manager (invoicing, payments, suppliers, décomptes)
   - `MAGASINIER`: Warehouse and site depot inventory manager
4. **Documentation**:
   - Keep `docs/` updated on any architectural, schema, or API change.
   - Reference `docs/phases/` before beginning implementation tasks.
