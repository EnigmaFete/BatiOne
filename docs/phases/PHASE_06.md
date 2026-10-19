# PHASE_06.md — Pointage des Équipes & Main d'Œuvre

## 1. Phase Objective
Digitalize construction site workforce tracking: Worker registry (Permanents, Journaliers, Tâcherons), fast mobile daily attendance pointage by Chef de Chantier, cash advances (acomptes), and automated payroll generation with real-time labor cost allocation to chantiers.

---

## 2. Deliverables Checklist

- [ ] `ouvriers` and `pointages` tables migration
- [ ] Worker catalog with Moroccan CIN, craft/trade (Maçon, Ferrailleur, Coffreur), daily/hourly wage
- [ ] Fast daily pointage grid for mobile/tablet:
  - Quick toggles: Présent (full day), Demi-journée, Absent
  - Overtime hours tracking
- [ ] Cash advance tracking (Acomptes sur salaire)
- [ ] Automated payroll calculation (État de Paie) and auto-injection into site job-costing ledger

---

## 3. Verification Gate

```bash
# Run workforce pointage and payroll calculation tests
npm test -- tests/unit/pointage.test.ts
```

**Sign-off Criteria**: Pointage for a 50-worker team can be logged in under 60 seconds; payroll correctly deducts acomptes; labor expense automatically updates the active chantier's cost ledger.
