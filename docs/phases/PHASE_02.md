# PHASE_02.md — Chantier & Project Lifecycle Management

## 1. Phase Objective
Build the core project and site management engine: Chantier creation, Moroccan geographic taxonomy, lifecycle state machine (`ETUDE` ➔ `EN_COURS` ➔ `RECEPTION_PROVISOIRE` ➔ `RECEPTION_DEFINITIVE` ➔ `CLOTURE`), and the daily site supervision log (Journal de Chantier).

---

## 2. Deliverables Checklist

- [ ] `chantiers` table migration & CRUD API endpoints
- [ ] Client & Contractor profile linking (Maître d'Ouvrage, BET, Bureau de Contrôle)
- [ ] Lifecycle status machine with transition validation rules
- [ ] Journal de Chantier (Daily Site Log):
  - Weather tracking (Pluie, Vent, Chaleur, Normal)
  - Work executed per trade
  - Incidents & safety alerts (Accidents de travail, arrêts de travail)
  - Photographic attachments of daily progress
- [ ] Responsive site dashboard for field managers

---

## 3. Verification Gate

```bash
# Run chantier lifecycle unit and integration tests
npm test -- tests/integration/chantiers.test.ts
```

**Sign-off Criteria**: Chantiers can be created, updated, and filtered by status and city; status transitions enforce business logic; daily logs persist with photo uploads.
