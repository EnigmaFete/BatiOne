import { createTenantPrismaClient } from '@batione/database';
import type { PrismaClient } from '@batione/database';

/**
 * Isole la logique d'injection de `organization_id` de l'extension Prisma (ARCHITECTURE.md §4.1)
 * sans dépendre d'une connexion PostgreSQL réelle : on fournit un faux client exposant
 * uniquement `$extends`, et on invoque directement le hook `$allOperations` capturé.
 */
type AllOperationsHook = (params: {
  model: string;
  operation: string;
  args: Record<string, unknown>;
  query: (args: unknown) => unknown;
}) => unknown;

function creerFauxPrismaClient() {
  let hookCapture: AllOperationsHook | undefined;

  const fauxClient = {
    $extends(config: { query: { $allModels: { $allOperations: AllOperationsHook } } }) {
      hookCapture = config.query.$allModels.$allOperations;
      return fauxClient;
    },
  };

  return {
    client: fauxClient as unknown as PrismaClient,
    invoquer: (params: { model: string; operation: string; args: Record<string, unknown> }) => {
      const queryEspion = jest.fn((args: unknown) => args);
      hookCapture!({ ...params, query: queryEspion });
      return queryEspion.mock.calls[0][0] as Record<string, unknown>;
    },
  };
}

describe('createTenantPrismaClient — Isolation Multi-Tenant (Couche 1)', () => {
  const ORG_ID = 'org-aaa-1111';

  it('rejette un organizationId vide', () => {
    const { client } = creerFauxPrismaClient();
    expect(() => createTenantPrismaClient(client, '')).toThrow();
  });

  it.each(['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'])(
    'injecte organization_id dans WHERE pour %s',
    (operation) => {
      const { client, invoquer } = creerFauxPrismaClient();
      createTenantPrismaClient(client, ORG_ID);
      const args = invoquer({ model: 'Chantier', operation, args: { where: { statut: 'EN_COURS' } } });
      expect(args.where).toEqual({ statut: 'EN_COURS', organization_id: ORG_ID });
    },
  );

  it('injecte organization_id dans DATA pour create (jamais dans where, qui n\'existe pas encore)', () => {
    const { client, invoquer } = creerFauxPrismaClient();
    createTenantPrismaClient(client, ORG_ID);
    const args = invoquer({ model: 'Chantier', operation: 'create', args: { data: { nom: 'Chantier A' } } });
    expect(args.data).toEqual({ nom: 'Chantier A', organization_id: ORG_ID });
  });

  it.each(['update', 'updateMany', 'delete', 'deleteMany'])(
    'injecte organization_id dans WHERE (jamais DATA) pour %s — non-régression de la faille IDOR corrigée',
    (operation) => {
      const { client, invoquer } = creerFauxPrismaClient();
      createTenantPrismaClient(client, ORG_ID);
      const args = invoquer({
        model: 'Chantier',
        operation,
        args: { where: { id: 'chantier-1' }, data: { nom: 'Nouveau nom' } },
      });
      expect(args.where).toEqual({ id: 'chantier-1', organization_id: ORG_ID });
      // La donnée métier ne doit JAMAIS porter organization_id — seule la clause WHERE restreint la ligne.
      expect(args.data).toEqual({ nom: 'Nouveau nom' });
    },
  );

  it('n\'injecte rien pour le modèle exempté Organization', () => {
    const { client, invoquer } = creerFauxPrismaClient();
    createTenantPrismaClient(client, ORG_ID);
    const args = invoquer({ model: 'Organization', operation: 'findMany', args: { where: { ville: 'Rabat' } } });
    expect(args.where).toEqual({ ville: 'Rabat' });
  });

  it('n\'injecte rien pour le modèle exempté RefreshToken (pas de colonne organization_id)', () => {
    const { client, invoquer } = creerFauxPrismaClient();
    createTenantPrismaClient(client, ORG_ID);
    const args = invoquer({ model: 'RefreshToken', operation: 'findUnique', args: { where: { id: 'rt-1' } } });
    expect(args.where).toEqual({ id: 'rt-1' });
  });

  it('un organizationId différent produit un filtre différent — pas de fuite croisée possible via ce mécanisme', () => {
    const { client, invoquer } = creerFauxPrismaClient();
    createTenantPrismaClient(client, 'org-bbb-2222');
    const args = invoquer({ model: 'Chantier', operation: 'findMany', args: {} });
    expect(args.where).toEqual({ organization_id: 'org-bbb-2222' });
  });
});
