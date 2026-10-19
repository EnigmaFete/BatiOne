# PHASE_00.md — Foundation, Scaffolding & Tooling Setup

## 1. Phase Objective
Establish the project foundation, developer tooling, linting, code formatting, directory structure, environment configuration, and verification pipeline for BatiOne.

---

## 2. Deliverables Checklist

- [ ] Project scaffolding with Node.js / React / TypeScript / Vite or Next.js
- [ ] Tailwind / Vanilla CSS token design system setup (Inter font, BTP color palette: deep slate, amber safety accents, steel grey, vibrant status indicators)
- [ ] Git repository configuration: `.gitignore`, commit message guidelines
- [ ] Quality tooling: ESLint, Prettier, TypeScript `tsconfig.json`
- [ ] Test harness configuration (Vitest / Jest) with sample unit test
- [ ] Database migration baseline (PostgreSQL schema runner)
- [ ] Healthcheck endpoint (`/api/health`) returning server status and timestamp

---

## 3. Implementation Steps

### Step 1: Base Configuration
- Initialize `package.json` with scripts:
  - `dev`, `build`, `lint`, `typecheck`, `test`, `test:coverage`, `db:migrate`.
- Configure `.gitignore` for node_modules, `.env`, `.env.local`, dist, coverage.

### Step 2: Styling & Token Architecture
- Implement Moroccan BTP visual design system:
  - Background: Clean sleek dark / modern light modes.
  - Primary Accent: Amber Construction Gold (`#D97706` / `#F59E0B`).
  - Neutral Base: Slate Navy (`#0F172A`, `#1E293B`, `#334155`).
  - Functional Colors: Emerald for profitability/on-track, Amber for warning/pending, Crimson for budget overruns/safety incidents.

### Step 3: Verification Harness
- Setup test runner with fast watch mode.
- Establish test helper for currency centime formatting (`formatMAD`, `toCentimes`).

---

## 4. Verification Gate

```bash
# Linter verification
npm run lint

# TypeScript verification
npm run typecheck

# Test suite execution
npm test

# Production build check
npm run build
```

**Sign-off Criteria**: All scripts exit with code 0; zero warnings; healthcheck returns HTTP 200 OK.
