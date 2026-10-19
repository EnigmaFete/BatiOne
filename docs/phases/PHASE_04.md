# PHASE_04.md — Dépenses, Suivi Financier & Rentabilité Réelle

## 1. Phase Objective
Build the real-time job costing engine: Expense tracking across 5 cost categories (Matériaux, Main d'Œuvre, Matériel, Sous-Traitance, Frais Généraux), receipt archiving, and dynamic margin calculation (Budget vs. Réalisé).

---

## 2. Deliverables Checklist

- [ ] `depenses` table migration and category classification
- [ ] Supplier invoice receipt uploading and metadata extraction
- [ ] Payment tracking: Virement, Chèque, Effet de commerce, Caisse de chantier
- [ ] Real-time job costing calculation engine:
  - Total committed vs. paid expenses
  - Revenue billed (Décomptes) vs. Expenses incurred
  - Gross Profit Margin (`Marge Brute`) and Net Margin (`Marge Nette`)
- [ ] Chantier financial health indicator (Green / Orange / Red alert thresholds)

---

## 3. Verification Gate

```bash
# Run job-costing and margin calculation unit tests
npm test -- tests/unit/jobCosting.test.ts
```

**Sign-off Criteria**: Cost allocations dynamically update site margin; over-budget warnings fire accurately when expenses exceed forecast.
