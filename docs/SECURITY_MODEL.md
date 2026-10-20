# SECURITY_MODEL.md — Architecture de Sécurité & Conformité BTP

## 1. Isolation Multi-Tenant Inviolable

### 1.1. Invariant de Sécurité
Chaque organisation cliente constitue une cellule de données étanche. Aucune donnée d'une organisation A ne peut être lue, modifiée, inférée ou listée par un utilisateur de l'organisation B.

### 1.2. Architecture de Cloisonnement
1. **Identification par Token Cryptographique** : Le JWT de l'utilisateur authentifié contient de manière inaltérable l'identifiant `organizationId`. Toute tentative de transmission d'un en-tête `X-Tenant-ID` tiers est invalidée par le guard NestJS `TenantGuard`.
2. **Couche ORM Prisma Étendue** : Le client Prisma n'exécute aucune requête sans injecter automatiquement le prédicat `WHERE organization_id = :orgId`. Les tentatives d'accès transversal déclenchent une exception de sécurité immédiate.
3. **Partitionnement du Stockage Documentaire** : Les documents sensibles (plans, scans de BL, photos CIN) sont stockés sous un préfixe isolé :
   `s3://batione-storage/{organization_id}/chantiers/{chantier_id}/...` avec URL présignées éphémères (validité maximale 15 minutes).

---

## 2. Matrice RBAC des Permissions (11 Rôles — cf. ADR-009)

> Élargie le 2026-10-20 de 6 à 11 rôles (ADR-009). Les 6 rôles BTP d'origine conservent exactement les permissions déjà actées ; les 5 nouveaux rôles (`GESTIONNAIRE`, `RH_PAIE`, `GESTIONNAIRE_MATERIEL`, `EMPLOYE`, `LECTEUR`) sont ajoutés pour couvrir le périmètre élargi.

| Module & Action | SUPERADMIN | ORG_ADMIN | GESTIONNAIRE | CONDUCTEUR TRAVAUX | CHEF CHANTIER | DAF/COMPTABLE | RH_PAIE | MAGASINIER | GEST. MATÉRIEL | EMPLOYE | LECTEUR |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Gestion Société & Paramètres** | Total | Total | Aucun | Aucun | Aucun | Lecture seule | Aucun | Aucun | Aucun | Aucun | Aucun |
| **Gestion Utilisateurs & Rôles** | Total | Total | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun |
| **Création & Gestion Projets/Chantiers** | Total | Total | Total | Total (Assignés) | Lecture seule | Lecture seule | Aucun | Aucun | Aucun | Lecture (Assignés) | Lecture seule |
| **Saisie Journal de Chantier / Tâches** | Total | Total | Total | Total | Total (Assigné) | Lecture seule | Aucun | Aucun | Aucun | Saisie (Assigné) | Lecture seule |
| **Devis & Factures (BPU et génériques)** | Total | Total | Total | Total | Aucun | Approbation/Scellement | Aucun | Aucun | Aucun | Aucun | Lecture seule |
| **Approbation Décomptes (Provisoires)** | Total | Total | Approbation | Approbation | Aucun | Approbation/Scellement | Aucun | Aucun | Aucun | Aucun | Lecture seule |
| **Dépenses & Encaissements** | Total | Total | Total | Saisie | Saisie | Validation & Scellement | Aucun | Aucun | Aucun | Aucun | Lecture seule |
| **Sortie de Stock (Bons de Sortie)** | Total | Total | Contrôle | Demande | Réception chantier | Contrôle | Aucun | Saisie & Déstockage | Aucun | Aucun | Lecture seule |
| **Saisie Pointage Journalier** | Total | Total | Validation | Validation | Saisie terrain | Contrôle | Contrôle paie | Aucun | Aucun | Saisie (soi-même) | Lecture seule |
| **Paie : Règles, Bulletins & Approbation** | Total | Total | Aucun | Aucun | Aucun | Validation & Paiement | Total | Aucun | Aucun | Lecture (son bulletin) | Aucun |
| **Acomptes Ouvriers** | Total | Total | Validation | Consultation | Saisie acomptes | Validation & Paiement | Validation | Aucun | Aucun | Aucun | Aucun |
| **Affectation Matériel/Engins** | Total | Total | Planification | Planification | Relevé compteur | Contrôle coût | Aucun | Aucun | Gestion totale | Lecture (Assigné) | Lecture seule |
| **Déclenchement d'une Extourne** | Total | Total | Demande motivée | Demande motivée | Interdit | Validation & Exécution | Validation (paie) | Interdit | Interdit | Interdit | Interdit |
| **Consultation Grand Livre Consolidé** | Total | Total | Synthèse | Synthèse projet | Aucun | Totalité | Synthèse paie | Aucun | Synthèse matériel | Aucun | Lecture seule (si autorisé) |
| **Génération de Documents (devis, factures, attestations…)** | Total | Total | Total | Selon type | Selon type | Selon type (finance) | Selon type (RH/paie) | Aucun | Selon type (matériel) | Aucun | Aucun |

---

## 3. Sécurité des Transactions & Immutabilité des Enregistrements

### 3.1. Scellement Opérationnel
- Dès qu'une ressource passe à l'état `ENREGISTRE` (Recorded), un hook Prisma ou un trigger d'intégrité bloque toute opération `UPDATE` ou `DELETE` directe sur les tables de fait.
- Toute correction impose la création d'une ligne d'extourne symétrique inverse (`statut = 'EXTOURNE'`) rattachée par `extourne_de_id`.

### 3.2. Prévention des Concurrences sur le Stock
- Pour prévenir la double allocation de matériaux (par exemple, deux chefs de chantier réservant le même lot de ciment simultanément), la vérification du stock disponible s'effectue dans une transaction interactive PostgreSQL avec niveau d'isolation sérialisable ou verrou pessimiste explicite.

---

## 4. Protection des Données Personnelles (Loi Marocaine 09-08 / CNDP)
- **Données Sensibles** : Numéros de CIN marocains, numéros d'immatriculation CNSS et photographies d'ouvriers.
- **Chiffrement** : Données à caractère personnel chiffrées au repos via AES-256.
- **Droit d'accès et de rectification** : Interface d'export et de rectification des fiches ouvriers pour conformité aux audits de l'inspection du travail et de la CNSS.
