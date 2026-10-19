# DECISIONS.md — Architecture Decision Records (ADR)

## Index of Decisions
- [ADR-001: Integer Centimes for Financial Calculations](#adr-001-integer-centimes-for-financial-calculations)
- [ADR-002: Row-Level Shared Database Multi-Tenancy](#adr-002-row-level-shared-database-multi-tenancy)
- [ADR-003: Offline-First Queue for Mobile Field Operations](#adr-003-offline-first-queue-for-mobile-field-operations)
- [ADR-004: Server-Side PDF Rendering for BTP Legal Documents](#adr-004-server-side-pdf-rendering-for-btp-legal-documents)
- [ADR-005: Native Moroccan BTP Billing & Tax Model](#adr-005-native-moroccan-btp-billing--tax-model)

---

### ADR-001: Integer Centimes for Financial Calculations
- **Status**: Accepted
- **Context**: BTP contracts in Morocco involve millions of MAD with micro-pricing on unit items (e.g., 14.50 MAD/m³ for excavation, 42.80 MAD/kg for rebar). Floating-point arithmetic (`0.1 + 0.2 = 0.30000000000000004`) causes accumulative penny rounding errors across large bordereaux and monthly décomptes.
- **Decision**: All financial amounts in the database, API contracts, and calculations are strictly stored and manipulated as integers representing **centimes** (1 MAD = 100 centimes). Conversion to formatted decimals occurs strictly at the presentation layer.
- **Consequences**:
  - *Positive*: Zero IEEE 754 rounding drift; 100% deterministic accounting reconciliations.
  - *Negative*: Developers must remember to multiply by 100 when ingesting user input and divide by 100 when displaying. Enforced via typed helper functions.

---

### ADR-002: Row-Level Shared Database Multi-Tenancy
- **Status**: Accepted
- **Context**: BatiOne serves multiple Moroccan construction companies of varying sizes (from SMEs with 2 sites to larger contractors with 30+ sites). We needed an architecture that scales cost-effectively while providing ironclad data isolation.
- **Decision**: Implement a pooled database model where all tenants share the PostgreSQL cluster, with mandatory row-level isolation via `organization_id` on every tenant table.
- **Consequences**:
  - *Positive*: Simple schema migrations, unified backups, low infrastructure cost per tenant.
  - *Negative*: Strict developer discipline required. Automated security test suites must enforce tenant scoping on 100% of queries.

---

### ADR-003: Offline-First Queue for Mobile Field Operations
- **Status**: Accepted
- **Context**: Moroccan construction sites frequently experience spotty, degraded, or nonexistent cellular reception (e.g. basements, remote roadworks). If the app blocks user actions when offline, site managers will revert to paper notebooks.
- **Decision**: Implement an IndexedDB offline mutation queue on the mobile web client with idempotency keys. The app allows recording daily pointages and taking BL photos offline, then automatically reconciles and syncs with the server when network connectivity is restored.
- **Consequences**:
  - *Positive*: Uninterrupted on-site experience; high adoption by Chefs de Chantier.
  - *Negative*: Requires conflict-resolution logic and idempotency headers on the backend.

---

### ADR-004: Server-Side PDF Rendering for BTP Legal Documents
- **Status**: Accepted
- **Context**: Official submissions in Morocco (Décomptes, Attachements, Devis, Marchés) require exact typographical layouts, official company headers (ICE, RC, IF), signature boxes, and stamp locations. Client-side browser printing creates inconsistent pagination and layout breakage across browsers.
- **Decision**: Generate all customer-facing and government-ready PDFs server-side using a deterministic rendering engine.
- **Consequences**:
  - *Positive*: Pixel-perfect, identical legal PDF documents across all operating systems and devices.
  - *Negative*: Adds modest CPU overhead on the backend during heavy batch export operations; mitigated via background queuing if necessary.

---

### ADR-005: Native Moroccan BTP Billing & Tax Model
- **Status**: Accepted
- **Context**: Generic SaaS invoicing platforms do not support the nuances of Moroccan construction contracts: cumulative décomptes with deduction of previous payments, contractual Retenue de Garantie (5% or 10% held until Réception Définitive), and specific VAT categories.
- **Decision**: Treat Décomptes as first-class citizens distinct from standard commercial invoices. Build the mathematical formula for cumulative attachment billing natively into the core domain model.
- **Consequences**:
  - *Positive*: Exact match with Moroccan public and private procurement standards; major competitive differentiator.
  - *Negative*: Requires domain-specific onboarding for engineers unfamiliar with BTP contract law.
