# API_CONTRACTS.md — Spécifications & Contrats d'API NestJS

## 1. Principes d'Ingénierie de l'API

### 1.1. Protocole, Format & Enveloppes
- **Base URL** : `/api/v1`
- **Format** : `application/json; charset=utf-8`
- **Langue des Messages** : Français en premier (*French-first*), codes d'erreur normalisés pour la traduction frontend (`next-intl`).
- **Authentification & En-têtes** :
  ```http
  Authorization: Bearer <jwt_access_token>
  X-Tenant-ID: <organization_id>
  ```

### 1.2. Enveloppe de Réponse Succès
```json
{
  "succes": true,
  "donnees": { ... },
  "metadonnees": {
    "page": 1,
    "limite": 25,
    "total": 142,
    "total_pages": 6
  }
}
```

### 1.3. Enveloppe d'Erreur Standardisée
```json
{
  "succes": false,
  "erreur": {
    "code": "STOCK_INSUFFISANT",
    "message": "Sortie de stock refusée : Quantité demandée (50 sac) supérieure à la quantité disponible (12 sac) dans le magasin source.",
    "champs": [
      {
        "champ": "quantite",
        "regle": "max_disponible",
        "valeur_actuelle": 12,
        "valeur_demandee": 50
      }
    ],
    "horodatage": "2026-10-19T19:30:00.000Z"
  }
}
```

---

## 2. Contrat Universel du Cycle de Vie (4 États) & Extournes

Pour toute ressource opérationnelle sensible (`decomptes`, `bons-sortie`, `pointages`, `depenses`) :

| Méthode | Endpoint | Description | Rôle Requis |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/:module/:id/soumettre` | Passe de `BROUILLON` à `SOUMIS` | Créateur / Terrain |
| `POST` | `/api/v1/:module/:id/approuver` | Passe de `SOUMIS` à `APPROUVE` | `CONDUCTEUR_TRAVAUX` / `DAF` |
| `POST` | `/api/v1/:module/:id/enregistrer` | Scelle en `ENREGISTRE` (impact réel) | `DAF` / `ORG_ADMIN` |
| `POST` | `/api/v1/:module/:id/extourner` | Crée une extourne symétrique inverse | `ORG_ADMIN`, `DAF` |

#### Payload d'Extourne Contrôlée (`POST /api/v1/:module/:id/extourner`)
```json
{
  "motif": "Erreur de saisie sur le métré de béton - attachement corrigé par le conducteur de travaux",
  "reference_justificatif": "PV-RECTIF-2026-03"
}
```

---

## 3. Catalogue des Endpoints par Module

### 3.1. Module 1 : Authentification & Organisation
| Méthode | Route | Description | Rôles |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/connexion` | Authentification (Email / Mot de passe) | Public |
| `POST` | `/api/v1/auth/rafraichir` | Renouvellement du JWT via cookie HTTP-only | Public |
| `GET` | `/api/v1/auth/moi` | Profil utilisateur connecté & organisation | Tous |
| `PATCH` | `/api/v1/organisation/profil` | Mise à jour des coordonnées (ICE, RC, Patente) | `ORG_ADMIN` |

### 3.2. Module 2 : Chantiers & Journal de Chantier
| Méthode | Route | Description | Rôles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/chantiers` | Liste des chantiers avec filtres (statut, ville) | Tous |
| `POST` | `/api/v1/chantiers` | Création d'un chantier | `ORG_ADMIN`, `CONDUCTEUR` |
| `GET` | `/api/v1/chantiers/:id` | Détail d'un chantier (KPIs, avancement, lots) | Tous |
| `PATCH` | `/api/v1/chantiers/:id` | Modification paramètres & statut | `CONDUCTEUR`, `ORG_ADMIN` |
| `GET` | `/api/v1/chantiers/:id/journal`| Liste des entrées du journal de chantier | Tous |
| `POST` | `/api/v1/chantiers/:id/journal`| Saisie du journal quotidien (météo, effectifs) | `CHEF_CHANTIER`, `CONDUCTEUR` |

### 3.3. Module 3 : Finance Opérationnelle & Décomptes
| Méthode | Route | Description | Rôles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/chantiers/:id/decomptes` | Historique des décomptes provisoires | Tous |
| `POST` | `/api/v1/chantiers/:id/decomptes` | Génération nouveau décompte mensuel cumulé | `CONDUCTEUR`, `DAF` |
| `GET` | `/api/v1/decomptes/:id/pdf` | Téléchargement du PDF officiel marocain | Tous |
| `GET` | `/api/v1/chantiers/:id/depenses` | Liste des dépenses de chantier par catégorie | Tous |
| `POST` | `/api/v1/chantiers/:id/depenses` | Saisie d'une dépense avec pièce jointe | `CHEF`, `CONDUCTEUR`, `DAF` |

### 3.4. Module 4 : Clients, Devis & Documents
| Méthode | Route | Description | Rôles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/tiers` | Répertoire des tiers (Clients, BET, Fournisseurs) | Tous |
| `POST` | `/api/v1/tiers` | Ajout d'un tiers avec vérification ICE | `ORG_ADMIN`, `DAF` |
| `GET` | `/api/v1/chantiers/:id/devis` | Consultation du devis / BPU | Tous |
| `POST` | `/api/v1/devis/:id/lignes/lot` | Enregistrement en masse des lignes de BPU | `CONDUCTEUR` |

### 3.5. Module 5 : Stocks & Approvisionnements (Contrat Bloquant)
| Méthode | Route | Description | Rôles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/stock/articles` | Catalogue des articles et stocks par magasin | Tous |
| `POST` | `/api/v1/stock/bons-commande` | Émission d'un Bon de Commande (BC) | `CONDUCTEUR`, `MAGASINIER` |
| `POST` | `/api/v1/stock/bons-livraison` | Réception de livraison sur chantier (BL) | `CHEF_CHANTIER`, `MAGASINIER` |
| `POST` | `/api/v1/stock/bons-sortie` | **Sortie de stock vers chantier (Bloquant)** | `MAGASINIER` |

#### Payload Sortie de Stock (`POST /api/v1/stock/bons-sortie`)
```json
{
  "magasin_source_id": "c8d8b2e1-4567-4f9e-b2d3-112233445566",
  "chantier_dest_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "date_sortie": "2026-10-20",
  "motif": "Coulage dalle étage 1",
  "lignes": [
    {
      "article_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "quantite_sortie": 50
    }
  ]
}
```
*Si le stock disponible est < 50, l'API renvoie HTTP 400 `STOCK_INSUFFISANT` et aucune ligne n'est modifiée.*

### 3.6. Module 6 : Main d'Œuvre & Pointage
| Méthode | Route | Description | Rôles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/ouvriers` | Liste des ouvriers avec qualifications et taux | Tous |
| `POST` | `/api/v1/ouvriers` | Création fiche ouvrier (CIN, statut, contrat) | `CONDUCTEUR`, `DAF` |
| `GET` | `/api/v1/chantiers/:id/pointages`| Grille de pointage pour une date donnée | Tous |
| `POST` | `/api/v1/chantiers/:id/pointages/lot`| Saisie mobile en masse du pointage journalier | `CHEF_CHANTIER` |
| `POST` | `/api/v1/ouvriers/:id/acomptes` | Saisie d'un acompte versé sur chantier | `CHEF`, `DAF` |

### 3.7. Module 7 : Parc Matériel & Engins
| Méthode | Route | Description | Rôles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/engins` | Inventaire des engins, statut et localisation | Tous |
| `POST` | `/api/v1/engins/affectations` | Affectation d'un engin à un chantier | `CONDUCTEUR`, `MAGASINIER` |
| `POST` | `/api/v1/engins/:id/releves` | Saisie relevé compteur horaire & carburant | `CHEF_CHANTIER` |

### 3.8. Module 8 : Écritures Consolidées & Audit
| Méthode | Route | Description | Rôles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/audit/ecritures-consolidees`| Consultation du grand livre opérationnel | `ORG_ADMIN`, `DAF` |
| `GET` | `/api/v1/audit/piste-journal` | Journal d'audit chronologique inaltérable | `ORG_ADMIN` |
| `GET` | `/api/v1/audit/export-comptable` | Export structuré CSV/Excel pour expert-comptable | `DAF`, `ORG_ADMIN` |

### 3.9. Module 9 : Tableaux de Bord & Analytics
| Méthode | Route | Description | Rôles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/direction` | Cockpit consolidé pour la Direction Générale | `ORG_ADMIN`, `DAF` |
| `GET` | `/api/v1/dashboard/chantiers/:id`| Synthèse budgétaire et opérationnelle chantier | Tous |
