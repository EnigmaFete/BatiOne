# PROGRESS.md — État d'Avancement & Journal des Réalisations BatiOne

## 1. Vue d'Ensemble du Projet
- **Application** : BatiOne — ERP & Job-Costing SaaS Multi-Tenant pour le BTP au Maroc
- **Langue Principale** : Français (Architecture prête pour l'internationalisation / i18n)
- **Stack Validée** : Next.js + React + TypeScript (Frontend), NestJS + TypeScript (Backend), PostgreSQL + Prisma (Base de données & ORM), Vitest / Jest / Supertest (Tests automatisés).
- **Périmètre Financier** : Suivi financier opérationnel & contrôle des coûts de chantier (Job Costing). Pas de comptabilité générale/légale statutaire.

---

## 2. Tableau de Bord des Modules & Jalons

| Module | Statut Spécification | Statut Architecture / Schéma | Statut Implémentation | Statut Tests Automatisés |
| :--- | :---: | :---: | :---: | :---: |
| **0. Socle & Gouvernance** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **1. Utilisateurs & Permissions (RBAC)** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **2. Projets, Chantiers & Tâches** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **3. Clients, Marchés & Documents** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **4. Finance & Décomptes Opérationnels**| ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **5. Stocks & Approvisionnements** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **6. RH, Main d'Œuvre & Pointage** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **7. Parc Matériel & Engins** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **8. Écritures Consolidées & Audit** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |
| **9. Tableaux de Bord & Analytics** | ✅ Validé | ✅ Validé | ⏳ En attente | ⏳ Non démarré |

*Légende : ✅ Validé | 🔄 En cours | ⏳ En attente / Non démarré | ❌ Bloqué*

---

## 3. Règle d'Or de l'État d'Avancement (Vérité Vérifiée)
1. **Zéro affirmation sans exécution** : Un test n'est jamais déclaré "passé" ou "vert" tant qu'il n'a pas été effectivement exécuté dans l'environnement avec un code de retour 0.
2. **Synchronisation documentaire continue** : Tout changement de contrat d'API, de modèle de données ou de logique métier entraîne une mise à jour immédiate du présent fichier et des spécifications associées.

---

## 4. Historique des Décisions et Actions

### 2026-10-19 : Cadrage Architectural & Spécification Initiale
- Initialisation du référentiel Git distant [`EnigmaFete/BatiOne`](https://github.com/EnigmaFete/BatiOne).
- Définition de la gouvernance multi-agents dans `AGENTS.md` et `CLAUDE.md`.
- Élaboration complète du dossier de conception technique : spécifications produit, architecture système, schéma relationnel Prisma, contrats d'API NestJS, modèle de sécurité, stratégie de test, feuille de route et journal des décisions d'architecture (ADR).
- Définition des invariants stricts : cycle de vie en 4 étapes (`brouillon` ➔ `soumis` ➔ `approuvé` ➔ `enregistré`), mécanisme d'extourne contrôlée pour les enregistrements scellés, interdiction absolue des sorties de stock excédentaires (stock négatif bloqué au niveau transactionnel), et limitation du périmètre financier au job-costing opérationnel.
- Réconciliation formelle de la revue d'architecture indépendante dans `AGENTS.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md` et `docs/DATABASE_SCHEMA.md` : précision sur `Prisma.Decimal` (ADR-007), extourne ordonnée des décomptes (ADR-003), atomicité SQL des mouvements de stock (ADR-002), et isolation multi-tenant à double niveau (Prisma étendu + PostgreSQL RLS sans `BYPASSRLS`).

