# ROADMAP.md — Feuille de Route & Jalons d'Ingénierie BatiOne

## 1. Vue d'Ensemble des Phases d'Exécution

```mermaid
gantt
    title BatiOne — Plan Directeur d'Ingénierie
    dateFormat  YYYY-MM
    section Socle & Sécurité
    Phase 00 : Socle Monorepo & Tooling         :done, p00, 2026-10, 1w
    Phase 01 : Multi-Tenancy, Auth & RBAC       :active, p01, after p00, 2w
    section Cœur Opérationnel Chantier
    Phase 02 : Chantiers, Lots & Journal        :p02, after p01, 2w
    Phase 03 : Tiers, Devis, Marchés & BPU      :p03, after p02, 2w
    Phase 04 : Finance, Décomptes & Retenues    :p04, after p03, 3w
    section Logistique & Terrain
    Phase 05 : Stocks & Sorties Bloquantes      :p05, after p04, 2w
    Phase 06 : Main d'Œuvre, Pointage & Paie    :p06, after p05, 2w
    Phase 07 : Parc Matériel & Imputation Engins:p07, after p06, 2w
    section Consolidation & Pilotage
    Phase 08 : Grand Livre, Audit & Dashboards  :p08, after p07, 2w
```

---

## 2. Détail des Jalons et Livrables

### Phase 00 : Socle Monorepo, Configuration & Tooling
- Architecture Monorepo (pnpm / npm workspaces : `apps/web` [Next.js], `apps/api` [NestJS], `packages/database` [Prisma], `packages/shared-types`).
- Design System tokens CSS BTP (charte graphique pro, contrastes chantier).
- Configuration PostgreSQL, scripts de migration Prisma, Docker Compose local.
- Environnement de test automatisé opérationnel.

### Phase 01 : Multi-Tenancy, Utilisateurs & Permissions (RBAC)
- Modèle `Organization` (ICE, RC, IF, Patente) et `User`.
- Client Prisma avec extension automatique d'isolation multi-tenant.
- Authentification JWT avec rotation de token et cookies HTTP-only.
- Matrice RBAC pour les 6 profils métiers BTP.

### Phase 02 : Projets, Chantiers & Journal de Chantier
- Modèle de données `Chantier`, lots de travaux et découpage en tâches.
- Machine d'états du cycle de vie du chantier (`ETUDE` ➔ `EN_COURS` ➔ `RECEPTION_PROVISOIRE` ➔ `RECEPTION_DEFINITIVE` ➔ `CLOTURE`).
- Journal de chantier quotidien (météo, effectifs, avancement, incidents de sécurité, photos).

### Phase 03 : Clients, Tiers, Marchés & Devis BPU
- Répertoire unifié des tiers (Maîtres d'Ouvrage, BET, Bureaux de contrôle, Sous-traitants).
- Éditeur de Bordereau des Prix Unitaires (BPU) et métrés prévisionnels.
- Gestion contractuelle des marchés et avenants.

### Phase 04 : Finance Opérationnelle, Décomptes & Retenues de Garantie
- Moteur de calcul des décomptes provisoires cumulatifs.
- Déduction automatique des acomptes antérieurs et retenue de garantie (5% ou 10%).
- Gestion des dépenses de chantier par catégorie de coût.
- Génération serveur des PDF de décomptes officiels.

### Phase 05 : Stocks, Approvisionnements & Règle Anti-Négatif
- Catalogue des articles et gestion multi-magasins (dépôts centraux et magasins chantiers).
- Circuit Demande d'Achat ➔ Bon de Commande ➔ Bon de Livraison (BL) réceptionné sur site.
- **Bons de Sortie avec verrou transactionnel bloquant toute sortie excédentaire.**
- Mouvements de stock scellés et transferts inter-chantiers.

### Phase 06 : RH, Main d'Œuvre & Pointage Mobile
- Répertoire du personnel de chantier (journaliers, permanents, tâcherons).
- Grille de pointage mobile optimisée pour saisie rapide par le Chef de Chantier.
- Gestion des acomptes sur salaire versés sur le terrain.
- État préparatoire de paie et imputation des coûts de main-d'œuvre aux chantiers.

### Phase 07 : Parc Matériel, Engins & Imputation Interne
- Inventaire des engins lourds et du matériel de chantier.
- Affectations sur chantiers et planning d'utilisation.
- Suivi des compteurs horaires/kilométriques et consommations de carburant.
- Refacturation horaire interne répercutée dans le coût de revient du chantier.

### Phase 08 : Écritures Consolidées, Grand Livre Opérationnel & Tableaux de Bord
- Grand livre opérationnel consolidé regroupant tous les mouvements scellés.
- Traçabilité et historique d'audit inaltérable.
- Mécanisme d'extourne contrôlée avec motif obligatoire.
- Tableaux de bord exécutifs (Direction Générale) et synthèses par chantier.
- Exports structurés (Excel / CSV) pour les progiciels de comptabilité légale externes.
