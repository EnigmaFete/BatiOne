# PHASE_07.md — Gestion du Matériel & Parc d'Engins

## 1. Phase Objective
Optimize construction machinery and tool logistics: Equipment registry (heavy machinery, vehicles, light tools), site allocation scheduling, operating hours & fuel logging, maintenance tracking, and hourly machine cost allocation to active chantiers.

---

## 2. Deliverables Checklist

- [ ] `engins` and `affectations_engins` tables migration
- [ ] Equipment catalog (Code engin, category, registration, internal hourly rate)
- [ ] Site deployment timeline and transfer receipts
- [ ] Site daily machine log (Working hours counter, Gasoil/fuel consumption)
- [ ] Automated internal machine charge calculation allocated to project expense ledger
- [ ] Preventative maintenance and inspection alert notifications (Vidange, Visite technique)

---

## 3. Verification Gate

```bash
# Run equipment allocation and internal cost calculation tests
npm test -- tests/unit/engins.test.ts
```

**Sign-off Criteria**: Machines cannot be double-allocated to conflicting sites simultaneously; hours worked translate directly into chantier equipment expenses.
