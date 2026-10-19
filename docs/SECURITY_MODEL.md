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

## 2. Matrice RBAC des Permissions (6 Rôles Métiers BTP)

| Module & Action | SUPERADMIN | ORG_ADMIN (Gérant) | CONDUCTEUR DE TRAVAUX | CHEF DE CHANTIER | DAF / COMPTABLE | MAGASINIER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Gestion Société & Paramètres** | Total | Total | Aucun | Aucun | Lecture seule | Aucun |
| **Création & Gestion Chantiers** | Total | Total | Total (Assignés) | Lecture seule | Lecture seule | Aucun |
| **Saisie Journal de Chantier** | Total | Total | Total | Total (Assigné) | Lecture seule | Aucun |
| **Création Devis & BPU** | Total | Total | Total | Aucun | Lecture seule | Aucun |
| **Approbation Décomptes (Provisoires)**| Total | Total | Approbation | Aucun | Approbation/Scellement | Aucun |
| **Sortie de Stock (Bons de Sortie)** | Total | Total | Demande | Réception chantier | Contrôle | Saisie & Déstockage |
| **Saisie Pointage Journalier** | Total | Total | Validation | Saisie terrain | Contrôle paie | Aucun |
| **Validation Définitive Paie & Acomptes**| Total | Total | Consultation | Saisie acomptes | Validation & Paiement | Aucun |
| **Affectation du Parc d'Engins** | Total | Total | Planification | Relevé compteur | Contrôle coût | Gestion atelier |
| **Déclenchement d'une Extourne** | Total | Total | Demande motivée | Interdit | Validation & Exécution| Interdit |
| **Consultation Grand Livre Consolidé** | Total | Total | Synthèse chantier | Aucun | Totalité | Aucun |

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
