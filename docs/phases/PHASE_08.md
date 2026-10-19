# PHASE_08.md — Tableaux de Bord Exécutifs, Reporting & Export

## 1. Phase Objective
Provide company executives, financial directors, and project directors with real-time operational intelligence: Consolidated multi-site dashboards, margin analytics, payment delay tracking, and official PDF/Excel report generation.

---

## 2. Deliverables Checklist

- [ ] Executive Cockpit (Director General View):
  - Total active chantiers, total contract value (MAD)
  - Global billing vs. collections vs. outstanding receivables (Créances clients)
  - Top performing & at-risk chantiers by net margin
- [ ] Project Director Cockpit:
  - Schedule progress vs. financial burn rate
  - Material delivery bottlenecks & labor attendance trends
- [ ] Export Engine:
  - Official PDF exports for Site Portfolios, Financial Summaries
  - Excel/CSV exports for external accountant integration
  - CNSS worker declaration reports

---

## 3. Verification Gate

```bash
# Run analytics query performance and export integration tests
npm test -- tests/integration/reporting.test.ts
```

**Sign-off Criteria**: Multi-site analytics aggregate under 300ms across 50,000+ transaction rows; Excel and PDF exports generate reliably.
