# TEST_STRATEGY.md — Quality Assurance & Verification Architecture

## 1. Testing Philosophy
In construction software, a financial error in a décompte or an incorrect unit price calculation directly causes cashflow loss, contractor disputes, or legal liability. 
Therefore, testing in BatiOne is **deterministic, automated, and non-negotiable**.

---

## 2. Test Pyramid & Coverage Expectations

```
          / \
         /   \      E2E Tests (10%)
        / E2E \     - Critical paths: Chantier creation -> Pointage -> Décompte
       /-------\
      / Integr. \   Integration Tests (30%)
     /   APIs    \  - Auth, Multi-tenant queries, DB constraints, PDF export
    /-------------\
   /     Unit      \ Unit Tests (60%)
  /   Calculations  \ - Financial rounding, VAT, Retenue, Ledger, Métrés
 /-------------------\
```

| Layer | Target Coverage | Scope & Responsibilities |
| :--- | :--- | :--- |
| **Unit Tests** | > 95% on Financial/Core logic | VAT calculations, centime conversions, décompte cumulatives, payroll computations |
| **Integration Tests** | > 85% on API endpoints | HTTP request/response validation, auth middleware, tenant boundary filtering |
| **Security Tests** | 100% on Tenant Isolation | Assert that User Org A cannot access or mutate Org B data under any condition |
| **E2E / Smoke Tests** | Core User Journeys | Login ➔ Create Site ➔ Add BPU ➔ Log Pointage ➔ Generate Décompte PDF |

---

## 3. Critical Test Suites

### 3.1. Financial Precision & Moroccan Tax Rules (`tests/unit/finance.test.ts`)
Must rigorously test:
- **Centime Representation**: Ensure zero rounding discrepancy when summing hundreds of BPU items.
- **Moroccan Retenue de Garantie**:
  ```typescript
  // Example test assertion
  const decompteBrutHT = 500_000_00; // 500,000.00 MAD in centimes
  const retenueTaux = 0.10; // 10%
  const retenueMontant = calculateRetenue(decompteBrutHT, retenueTaux);
  expect(retenueMontant).toBe(50_000_00);
  
  const netHT = decompteBrutHT - retenueMontant;
  const tva20 = calculateTVA(netHT, 0.20);
  expect(tva20).toBe(90_000_00);
  expect(netHT + tva20).toBe(540_000_00);
  ```
- **Cumulative Décomptes**: Décompte N°3 must accurately subtract Décompte N°1 and N°2 amounts.

### 3.2. Multi-Tenant Leakage Verification (`tests/security/tenantIsolation.test.ts`)
Every pull request or release gate runs tenant isolation suites:
```typescript
test('should strictly forbid Org A user from fetching Org B chantier', async () => {
  const orgA_Token = await generateToken({ orgId: 'org-aaa', role: 'CONDUCTEUR_TRAVAUX' });
  const orgB_ChantierId = 'chantier-belonging-to-org-bbb';

  const res = await request(app)
    .get(`/api/v1/chantiers/${orgB_ChantierId}`)
    .set('Authorization', `Bearer ${orgA_Token}`);

  expect(res.status).toBe(404); // Must not reveal existence (404 instead of 403)
});
```

### 3.3. Offline Sync & Conflict Resolution (`tests/unit/sync.test.ts`)
- Queueing 20 pointage entries offline.
- Simulating network reconnection.
- Verifying idempotency keys: duplicate submissions do not double-bill worker hours.

---

## 4. Test Execution Commands

```bash
# Full test run
npm test

# Fast unit tests only (instant feedback during development)
npm run test:unit

# Run with test coverage report
npm run test:coverage

# Security & tenant boundary verification
npm run test:security
```

---

## 5. Release Quality Gate (Verification Checklist)

An autonomous agent or engineer may only mark a phase or release as ready when:
1. All unit tests pass with zero failures.
2. All integration tests pass against a clean test database.
3. Tenant isolation test suite passes with zero leaks.
4. Linter (`npm run lint`) outputs zero errors and zero warnings.
5. Production build (`npm run build`) completes cleanly.
