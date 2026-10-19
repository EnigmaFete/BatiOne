# API_CONTRACTS.md — REST API Specifications

## 1. General Principles

### 1.1. Base URL & Protocol
- Base URL: `/api/v1`
- Content-Type: `application/json` (except multipart file uploads)
- Charset: `UTF-8`

### 1.2. Authentication & Headers
All secured endpoints require a valid JWT Bearer token:
```http
Authorization: Bearer <jwt_token>
X-Tenant-ID: <organization_id>
```

### 1.3. Standard Response Formats

#### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 142
  }
}
```

#### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Le chantier spécifié est introuvable ou n'appartient pas à votre organisation.",
    "details": []
  }
}
```

---

## 2. API Endpoints Catalog

### 2.1. Authentication & Organization
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Email/password login, returns JWT and user profile | Public |
| `POST` | `/api/v1/auth/refresh` | Refresh access token via HTTP-only refresh cookie | Public |
| `GET` | `/api/v1/auth/me` | Fetch active user profile, tenant details & permissions | Authenticated |
| `PUT` | `/api/v1/organization/profile` | Update corporate details (ICE, RC, Patente, logo) | `ORG_ADMIN` |

### 2.2. Chantiers (Construction Sites)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/chantiers` | List all chantiers with filters (`statut`, `ville`, `search`) | All Roles |
| `POST` | `/api/v1/chantiers` | Create a new chantier project | `ORG_ADMIN`, `CONDUCTEUR` |
| `GET` | `/api/v1/chantiers/:id` | Detailed view: KPIs, budget vs. real costs, margins | All Roles |
| `PATCH` | `/api/v1/chantiers/:id` | Update status, budget, key dates, assigned team | `ORG_ADMIN`, `CONDUCTEUR` |
| `GET` | `/api/v1/chantiers/:id/rentabilite`| Real-time financial health, net margin, cost breakdown | `ORG_ADMIN`, `DAF` |

### 2.3. Devis & Bordereau des Prix
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/chantiers/:id/devis` | List devis / marché items for a chantier | All Roles |
| `POST` | `/api/v1/chantiers/:id/devis` | Create devis with itemized bordereau des prix | `ORG_ADMIN`, `CONDUCTEUR` |
| `POST` | `/api/v1/devis/:id/lignes` | Batch add/update work lines (m², m³, prix unitaire) | `CONDUCTEUR` |
| `GET` | `/api/v1/devis/:id/export-pdf` | Generate printable Moroccan standard quotation PDF | All Roles |

### 2.4. Décomptes (BTP Monthly Billing)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/chantiers/:id/decomptes` | List cumulative monthly décomptes | All Roles |
| `POST` | `/api/v1/chantiers/:id/decomptes` | Create new monthly décompte with auto-retenue | `DAF`, `CONDUCTEUR` |
| `PATCH` | `/api/v1/decomptes/:id/status` | Advance status (`SOUMIS` ➔ `APPROUVE` ➔ `PAYE`) | `ORG_ADMIN`, `DAF` |
| `GET` | `/api/v1/decomptes/:id/export-pdf`| Official printable Décompte Provisoire / Définitif | All Roles |

### 2.5. Dépenses & Bons de Commande (Cost Control)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/chantiers/:id/depenses` | List expenses filtered by category, date, supplier | All Roles |
| `POST` | `/api/v1/chantiers/:id/depenses` | Record site expense with receipt upload | `DAF`, `CONDUCTEUR`, `CHEF` |
| `POST` | `/api/v1/achats/bons-commande` | Issue supplier Bon de Commande (BC) | `CONDUCTEUR`, `MAGASINIER` |
| `POST` | `/api/v1/achats/bons-livraison` | Register receipt note (BL) signed on site | `CHEF_CHANTIER` |

### 2.6. Main d'Œuvre & Pointage
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/ouvriers` | Worker registry with daily rates | All Roles |
| `POST` | `/api/v1/ouvriers` | Add worker (Permanent, Journalier, Tâcheron) | `ORG_ADMIN`, `CONDUCTEUR` |
| `GET` | `/api/v1/chantiers/:id/pointages`| Get pointage sheet for specified date | All Roles |
| `POST` | `/api/v1/chantiers/:id/pointages`| Bulk submit daily worker attendance and hours | `CHEF_CHANTIER`, `CONDUCTEUR`|
| `GET` | `/api/v1/paie/recapitulatif` | Generate payroll summary per worker & site | `ORG_ADMIN`, `DAF` |

### 2.7. Matériel & Engins
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/engins` | List company machinery, location & status | All Roles |
| `POST` | `/api/v1/engins/:id/affectation`| Dispatch machine to a specific chantier | `CONDUCTEUR`, `MAGASINIER` |
| `POST` | `/api/v1/engins/:id/heures` | Log working hours / fuel consumption on site | `CHEF_CHANTIER` |
