# PHASE_03.md — Devis, Bordereau des Prix (BPU) & Décomptes

## 1. Phase Objective
Implement the Moroccan BTP financial bidding and billing engine: Itemized Bordereau des Prix Unitaires (BPU), Devis calculations, Métrés, and monthly Décomptes Provisoires with automatic cumulative deduction and Retenue de Garantie.

---

## 2. Deliverables Checklist

- [ ] `devis` and `devis_lignes` tables migration
- [ ] BPU interactive editor supporting units (`m²`, `m³`, `ml`, `u`, `kg`, `forfait`)
- [ ] `decomptes` and `decompte_lignes` tables migration
- [ ] Mathematical calculation engine for:
  - Cumulative billing from accepted monthly attachments
  - Automatic deduction of preceding décomptes
  - Automatic calculation & withholding of Retenue de Garantie (5% / 10%)
  - Moroccan TVA (20%) application
- [ ] Server-side PDF export of official Décompte Provisoire / Définitif

---

## 3. Verification Gate

```bash
# Run financial precision and décompte calculation tests
npm test -- tests/unit/decomptes.test.ts
```

**Sign-off Criteria**: Calculations for 100+ line BPU items balance to the exact centime; cumulative décomptes match Moroccan public procurement standards; PDF renders with proper headers and signature zones.
