# PHASE_01.md — Multi-Tenant Core, Authentication & Role-Based Access Control

## 1. Phase Objective
Implement multi-tenant data architecture, organization profiles (ICE, RC, IF, Patente), secure JWT authentication, password hashing, session refresh mechanisms, and strict Role-Based Access Control (RBAC).

---

## 2. Deliverables Checklist

- [ ] `organizations` table migration & repository
- [ ] `users` table migration with password hashing (Argon2id / bcrypt)
- [ ] JWT authentication pipeline (Login, Logout, Token Refresh, Me endpoints)
- [ ] Multi-tenant isolation middleware (`tenant_id` validation & injection)
- [ ] RBAC guard middleware supporting 6 distinct roles:
  - `SUPERADMIN`
  - `ORG_ADMIN` (Directeur Général)
  - `CONDUCTEUR_TRAVAUX` (Project Manager)
  - `CHEF_CHANTIER` (Site Manager)
  - `DAF_COMPTABLE` (Finance / Accounting)
  - `MAGASINIER` (Depot / Warehouse)
- [ ] Automated security tests proving zero tenant data cross-contamination

---

## 3. Verification Gate

```bash
# Run tenant isolation security tests
npm run test:security

# Run authentication integration tests
npm test -- tests/integration/auth.test.ts
```

**Sign-off Criteria**: Zero cross-tenant data leaks; unauthorized role requests receive HTTP 403; expired tokens trigger clean refresh or redirect to login.
