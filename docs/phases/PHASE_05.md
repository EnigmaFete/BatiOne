# PHASE_05.md — Gestion des Matériaux, Bons de Commande & Stocks

## 1. Phase Objective
Track material flows from procurement to on-site consumption: Demande d'Achat (DA), Bon de Commande (BC), on-site Bon de Livraison (BL) verification by Chef de Chantier, 3-way matching with invoices, and stock management between central depot and active chantiers.

---

## 2. Deliverables Checklist

- [ ] `articles_stock`, `bons_commande`, and `bons_livraison` tables migration
- [ ] Supplier purchase workflow (DA ➔ BC ➔ BL)
- [ ] Mobile-friendly BL receipt capture: photo of signed delivery note, quantity check against BC
- [ ] Three-way matching guard (prevents paying supplier invoices without verified BL)
- [ ] Site inventory movements (Ciment, Sable, Acier, Briques, Peinture)

---

## 3. Verification Gate

```bash
# Run procurement and 3-way matching integration tests
npm test -- tests/integration/procurement.test.ts
```

**Sign-off Criteria**: Purchase orders link to delivery notes; unmatched deliveries flag accounting discrepancies; inventory counts update deterministically.
