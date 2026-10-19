# BatiOne

> **Pilotez vos chantiers, maîtrisez votre rentabilité.**
> Gérez projets, finances, matériaux, équipes et matériel depuis une seule plateforme — pensée pour les entreprises BTP au Maroc.

---

## 🏗️ Architecture & Documentation

The project follows a rigorous, phase-based engineering specification:

```
docs/
├── PRODUCT_SPEC.md        # Comprehensive BTP product specifications
├── ARCHITECTURE.md        # Technical architecture, stack, patterns
├── DATABASE_SCHEMA.md     # Relational schema & Moroccan BTP entities
├── API_CONTRACTS.md       # REST endpoints, error envelopes, and RBAC
├── SECURITY_MODEL.md      # Multi-tenant isolation & data compliance (Law 09-08)
├── TEST_STRATEGY.md       # Testing pyramid & financial precision checks
├── ROADMAP.md             # Milestones & phased execution plan
├── DECISIONS.md           # Architecture Decision Records (ADRs)
└── phases/
    ├── PHASE_00.md        # Foundation & Tooling
    ├── PHASE_01.md        # Multi-Tenant Core, Auth & RBAC
    ├── PHASE_02.md        # Chantier Lifecycle & Journal
    ├── PHASE_03.md        # Devis, BPU & Décomptes
    ├── PHASE_04.md        # Dépenses & Job Costing Ledger
    ├── PHASE_05.md        # Matériaux, BC/BL & Stocks
    ├── PHASE_06.md        # Pointage & Main d'Œuvre
    ├── PHASE_07.md        # Parc Engins & Matériel
    └── PHASE_08.md        # Tableaux de Bord & Exports
```

For AI agent operating rules and assistant references, see:
- [AGENTS.md](file:///Users/mohamedtazi/Desktop/ANTIGRAVITY%20FOLDER/BatiOne/AGENTS.md)
- [CLAUDE.md](file:///Users/mohamedtazi/Desktop/ANTIGRAVITY%20FOLDER/BatiOne/CLAUDE.md)

---

## 🇲🇦 Moroccan BTP Specifics Native Support
- **Bordereau des Prix Unitaires (BPU)** & métrés.
- **Décomptes Provisoires & Définitifs** with automatic deduction of previous décomptes.
- **Retenue de Garantie** (5% / 10%) calculation and withholding.
- **TVA** (20% standard, 14% transport/equipment).
- **Daily Site Attendance (Pointage)** for journaliers & permanent labor.
- **Mobile-friendly on-site delivery receipt (BL)** verification.
