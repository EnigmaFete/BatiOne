import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Modèles qui ne portent pas de colonne `organization_id` et doivent donc être exemptés de
 * l'injection automatique du filtre tenant. `Organization` est le tenant lui-même ; les autres
 * modèles listés ici sont rattachés à l'organisation indirectement (ex. via `user_id`), jamais
 * directement.
 *
 * cf. ARCHITECTURE.md §4.1 (Couche 1 — Extension Prisma).
 */
const TENANT_EXEMPT_MODELS = new Set<Prisma.ModelName>(['Organization', 'RefreshToken']);

/**
 * Crée un client Prisma scopé à une organisation : toute opération de lecture ou d'écriture
 * (create/update/updateMany/delete/deleteMany inclus) sur un modèle tenant se voit injecter
 * automatiquement `organization_id = organizationId` — jamais dérivé d'un en-tête client.
 *
 * Défense en profondeur : cette extension est la Couche 1 uniquement. La Couche 2 (PostgreSQL
 * Row-Level Security) reste un livrable distinct de phase d'implémentation (cf. ARCHITECTURE.md
 * §4.1) — ne pas considérer l'isolation comme complète tant que la RLS n'est pas activée et testée.
 */
export function createTenantPrismaClient(prisma: PrismaClient, organizationId: string) {
  if (!organizationId) {
    throw new Error('createTenantPrismaClient: organizationId est obligatoire et ne peut être vide.');
  }

  return prisma.$extends({
    name: 'tenantIsolation',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (TENANT_EXEMPT_MODELS.has(model)) {
            return query(args);
          }

          const readOperations = ['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy'];
          const mutateWhereOperations = ['update', 'updateMany', 'delete', 'deleteMany', 'upsert'];

          if (readOperations.includes(operation)) {
            (args as { where?: Record<string, unknown> }).where = {
              ...(args as { where?: Record<string, unknown> }).where,
              organization_id: organizationId,
            };
          }

          if (operation === 'create') {
            const createArgs = args as { data?: Record<string, unknown> };
            if (createArgs.data) {
              createArgs.data.organization_id = organizationId;
            }
            // Note : les écritures imbriquées (relations create() en cascade) ne sont PAS
            // couvertes automatiquement — le service appelant DOIT fixer organization_id
            // explicitement sur chaque création imbriquée (cf. ARCHITECTURE.md §4.1).
          }

          if (operation === 'createMany') {
            const createManyArgs = args as { data?: Record<string, unknown>[] };
            if (Array.isArray(createManyArgs.data)) {
              createManyArgs.data = createManyArgs.data.map((row) => ({ ...row, organization_id: organizationId }));
            }
          }

          if (mutateWhereOperations.includes(operation)) {
            // Correctif critique (ARCHITECTURE.md §4.1) : le filtre tenant DOIT être fusionné
            // dans WHERE, jamais dans DATA — sinon la ligne cible n'est jamais restreinte par
            // organisation (faille IDOR inter-tenant).
            const whereArgs = args as { where?: Record<string, unknown> };
            whereArgs.where = { ...whereArgs.where, organization_id: organizationId };
          }

          return query(args);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof createTenantPrismaClient>;
