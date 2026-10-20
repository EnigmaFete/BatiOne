import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@batione/database';

/**
 * Client Prisma global, NON scopé par tenant. Réservé aux opérations qui précèdent la
 * connaissance de l'organisation (connexion, inscription) ou qui portent sur `Organization`
 * elle-même. Toute opération métier sur une table tenant doit utiliser `TenantPrismaService`
 * à la place (cf. common/prisma/tenant-prisma.service.ts).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on('beforeExit', () => {
      void app.close();
    });
  }
}
