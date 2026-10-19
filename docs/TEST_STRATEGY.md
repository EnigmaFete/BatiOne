# TEST_STRATEGY.md — Stratégie de Test & Assurance Qualité Déterministe

## 1. Règle Fondamentale : Zéro Affirmation sans Preuve d'Exécution
Dans le cadre de l'ingénierie BatiOne :
- **Un test n'est JAMAIS déclaré "passé" ou "vert" sans avoir été effectivement exécuté dans la console avec retour de code 0.**
- Tout rapport d'avancement doit être appuyé par la commande lancée et la sortie textuelle du test runner.

---

## 2. Pyramide des Tests BatiOne

```
               / \
              /   \       Tests E2E (10%)
             / E2E \      - Parcours complet : Devis -> Sortie Stock -> Décompte
            /-------\
           / Integr. \    Tests d'Intégration API & DB (30%)
          /   APIs    \   - Isolation Multi-Tenant, Verrouillage Concurrence Stock
         /-------------\
        /     Unit      \ Tests Unitaires (60%)
       /   Calculs &     \ - Mathématiques financières BTP, Règles d'invariants,
      /   Transitions     \  Transitions d'états (4 étapes) & Extournes
     /---------------------\
```

---

## 3. Suites de Tests Critiques

### 3.1. Invariant de Stock : Blocage des Sorties Excédentaires (`tests/unit/stockInvariant.spec.ts`)
```typescript
describe('Gestion des Sorties de Stock - Invariant Anti-Négatif', () => {
  it('doit bloquer immédiatement une sortie de stock supérieure au disponible', async () => {
    const stockInitial = 25; // 25 sacs de ciment disponibles
    const quantiteDemandee = 30; // Tentative de sortie de 30 sacs

    await expect(
      stockService.enregistrerSortieStock({
        articleId: 'art-ciment',
        magasinId: 'depot-central',
        quantite: quantiteDemandee,
      })
    ).rejects.toThrowError(/STOCK_INSUFFISANT/);
  });

  it('doit bloquer les conditions de concurrence (race condition) via transaction atomique', async () => {
    // 2 requêtes simultanées de 15 sacs sur un stock disponible de 20
    const promises = [
      stockService.enregistrerSortieStock({ articleId: 'art-fer', magasinId: 'm1', quantite: 15 }),
      stockService.enregistrerSortieStock({ articleId: 'art-fer', magasinId: 'm1', quantite: 15 }),
    ];

    const results = await Promise.allSettled(promises);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });
});
```

### 3.2. Cycle Opérationnel en 4 États & Extournes (`tests/unit/lifecycle.spec.ts`)
```typescript
describe('Cycle de Vie des Documents Sensibles', () => {
  it('doit respecter strictement la chaîne Brouillon -> Soumis -> Approuvé -> Enregistré', async () => {
    const doc = await service.creerBrouillon();
    expect(doc.statut).toBe('BROUILLON');

    const soumis = await service.soumettre(doc.id);
    expect(soumis.statut).toBe('SOUMIS');

    const approuve = await service.approuver(soumis.id);
    expect(approuve.statut).toBe('APPROUVE');

    const enregistre = await service.enregistrer(approuve.id);
    expect(enregistre.statut).toBe('ENREGISTRE');

    // Tentative de modification directe interdite
    await expect(service.modifier(enregistre.id, { montant: 500 })).rejects.toThrow();
  });

  it('doit générer une écriture inverse lors d\'une extourne d\'un enregistrement scellé', async () => {
    const enregistre = await service.obtenirEnregistre('doc-123');
    const extourne = await service.extourner(enregistre.id, { motif: 'Erreur saisie métré' });

    expect(extourne.statut).toBe('EXTOURNE');
    expect(extourne.extourne_de_id).toBe(enregistre.id);
    expect(extourne.montant_net_ht).toEqual(enregistre.montant_net_ht.negated());
  });
});
```

### 3.3. Isolation Multi-Tenant (`tests/security/multiTenantIsolation.spec.ts`)
```typescript
describe('Sécurité & Cloisonnement Multi-Tenant', () => {
  it('interdit rigoureusement à l\'organisation A d\'accéder aux données de l\'organisation B', async () => {
    const tokenOrgA = await authHelper.creerToken({ orgId: 'org-aaa', role: 'CONDUCTEUR_TRAVAUX' });
    const chantierOrgB = await dbHelper.creerChantierPourOrg('org-bbb');

    const reponse = await request(app.getHttpServer())
      .get(`/api/v1/chantiers/${chantierOrgB.id}`)
      .set('Authorization', `Bearer ${tokenOrgA}`);

    // Doit retourner 404 (pour ne pas divulguer l'existence) et jamais 200
    expect(reponse.status).toBe(404);
  });
});
```

---

## 4. Matrice d'Exécution & Commandes de Validation

```bash
# Lancement de la suite complète
npm test

# Tests unitaires seuls (rapides, calculs et logique métier)
npm run test:unit

# Tests d'intégration (API NestJS et PostgreSQL)
npm run test:integration

# Tests d'isolation de sécurité multi-tenant
npm run test:security
```
