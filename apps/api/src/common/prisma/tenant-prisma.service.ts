import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { createTenantPrismaClient, TenantPrismaClient } from '@batione/database';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { PrismaService } from './prisma.service';

/**
 * Client Prisma scopé à l'organisation de la requête courante (request-scoped).
 * `organizationId` provient exclusivement de `request.jwtPayload.organizationId`, posé par
 * `JwtAuthGuard`/`TenantGuard` après vérification cryptographique du JWT — jamais d'un en-tête
 * client (cf. SECURITY_MODEL.md §1.2, ADR-017).
 *
 * Statut : Couche 1 de l'isolation multi-tenant uniquement. La Couche 2 (PostgreSQL RLS) est un
 * livrable distinct non implémenté à ce stade (cf. ARCHITECTURE.md §4.1).
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantPrismaService {
  private client: TenantPrismaClient | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request & { user?: AuthenticatedUser },
  ) {}

  /**
   * organizationId de la requête courante — à utiliser explicitement lorsqu'un service doit
   * fixer `organization_id` dans une écriture imbriquée (non couverte par l'extension, cf.
   * ARCHITECTURE.md §4.1) ou, par défense en profondeur, en doublon de l'injection automatique
   * sur une création de premier niveau (le typage Prisma généré exige le champ statiquement,
   * l'extension ne modifie que le comportement runtime — cf. TenantPrismaService.db).
   */
  get organizationId(): string {
    const organizationId = this.request.user?.organizationId;
    if (!organizationId) {
      throw new Error(
        "TenantPrismaService: aucune organizationId sur la requête — JwtAuthGuard doit s'exécuter avant tout accès à TenantPrismaService.",
      );
    }
    return organizationId;
  }

  get db(): TenantPrismaClient {
    if (!this.client) {
      this.client = createTenantPrismaClient(this.prisma, this.organizationId);
    }
    return this.client;
  }
}
