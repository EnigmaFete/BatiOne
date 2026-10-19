# SECURITY_MODEL.md — Security & Compliance Architecture

## 1. Multi-Tenant Data Isolation

### 1.1. Invariant Guarantee
Every piece of customer data belongs strictly to a single `organization_id`. At no time should data from Organization A be accessible to, modifiable by, or visible to Organization B.

### 1.2. Enforcement Mechanisms
1. **JWT & Session Binding**: The user's authenticated token carries the verified `organizationId`. Client-supplied tenant headers are cross-checked against this cryptographically signed claim.
2. **Database Query Level**: All ORM/SQL repositories automatically inject `WHERE organization_id = :orgId`. Direct raw queries that omit tenant parameters are rejected by pre-commit linters and code reviews.
3. **Storage Namespacing**: S3 / local file storage buckets partition documents into isolated paths:
   `/storage/tenants/{organization_id}/chantiers/{chantier_id}/...`

---

## 2. Authentication & Session Management

- **Password Hashing**: Argon2id or bcrypt (cost factor >= 12).
- **Access Tokens**: Short-lived JWTs (15 minutes expiry) signed via RS256 or HS256.
- **Refresh Tokens**: Long-lived (7–30 days) stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies, with automatic revocation on reuse or logout.
- **Brute Force Protection**: Rate limiting on `/api/v1/auth/login` (maximum 5 failed attempts per IP/account per 15 minutes).

---

## 3. Role-Based Access Control (RBAC) Matrix

| Feature / Resource | SUPERADMIN | ORG_ADMIN (Gérant) | CONDUCTEUR DE TRAVAUX | CHEF DE CHANTIER | DAF / COMPTABLE | MAGASINIER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Manage Tenant & Settings** | Full | Full | None | None | Read-only | None |
| **Create / Archive Chantiers**| Full | Full | Full | None | Read-only | None |
| **View Financial Margins** | Full | Full | Full | None | Full | None |
| **Create Devis & BPU** | Full | Full | Full | Read-only | Read-only | None |
| **Generate & Sign Décomptes** | Full | Full | Full | None | Full | None |
| **Approve Supplier Invoices** | Full | Full | Read/Validate | None | Full | None |
| **Daily Pointage Entry** | Full | Full | Full | Full (Assigned) | Read-only | None |
| **Validate Payroll (Paie)** | Full | Full | Read-only | None | Full | None |
| **Sign BL (Reception Matériaux)**| Full | Full | Full | Full (Assigned) | Read-only | Full |
| **Dispatch Heavy Machinery** | Full | Full | Full | None | Read-only | Full |

---

## 4. Input Validation & Defense-in-Depth

- **Strict Validation**: All incoming requests pass through declarative Zod schemas before touching any service logic.
- **SQL Injection Prevention**: Prepared statements and parameterized queries exclusively.
- **Cross-Site Scripting (XSS)**: Automatic HTML entity escaping across all rendered UI fields; strict `Content-Security-Policy` (CSP) headers.
- **Cross-Origin Resource Sharing (CORS)**: Strict whitelist restricting API access exclusively to trusted BatiOne domains.

---

## 5. File Upload Safeguards
Field workers upload photos of site progress and scanned supplier delivery notes (Bons de Livraison).
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
- **File size limits**: Max 10MB per file.
- **Malware & Execution Prevention**: Files are stored outside the web server root, served with `Content-Disposition: inline` and forced non-executable MIME headers. Original filenames are replaced with random UUIDs.

---

## 6. Audit Trail & Financial Immutability
- Financial transactions (issued décomptes, approved supplier invoices, recorded wage distributions) are append-only.
- All mutating actions record:
  - `user_id`
  - `action` (`CREATE`, `UPDATE_STATUS`, `DELETE`, `APPROVE`)
  - `resource_type` and `resource_id`
  - `ip_address`
  - `timestamp`
  - `changes_diff` (JSON snapshot of modified fields)

---

## 7. Regulatory Compliance (Morocco CNDP Law 09-08)
Worker registries store Moroccan National Identity Card (CIN) numbers and attendance data:
- Personal data is encrypted at rest using AES-256.
- Workers can request rectification of their attendance/identity records.
- Export capabilities provide full transparency for CNSS and labor inspection audits.
