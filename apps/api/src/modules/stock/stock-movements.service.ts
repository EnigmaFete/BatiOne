import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TypeMouvementStock } from '@batione/database';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

@Injectable()
export class StockMovementsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async lister(articleId?: string, projectId?: string) {
    return this.tenantPrisma.db.stockMovement.findMany({
      where: {
        ...(articleId ? { article_id: articleId } : {}),
        ...(projectId ? { project_id: projectId } : {}),
      },
      include: {
        article: { select: { id: true, code: true, nom: true, unite: true } },
        project: { select: { id: true, code: true, nom: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }

  async enregistrer(dto: CreateStockMovementDto, userId: string) {
    switch (dto.type) {
      case TypeMouvementStock.ENTREE:
        return this.entree(dto, userId);
      case TypeMouvementStock.SORTIE:
        return this.sortie(dto, userId);
      case TypeMouvementStock.AJUSTEMENT:
        return this.ajustement(dto, userId);
    }
  }

  private async entree(dto: CreateStockMovementDto, userId: string) {
    const orgId = this.tenantPrisma.organizationId;
    return this.tenantPrisma.db.$transaction(async (tx) => {
      await tx.article.update({
        where: { id: dto.articleId },
        data: { quantite_disponible: { increment: dto.quantite } },
      });
      return tx.stockMovement.create({
        data: {
          organization_id: orgId,
          article_id: dto.articleId,
          type: TypeMouvementStock.ENTREE,
          quantite: dto.quantite,
          cout_unitaire: dto.coutUnitaire,
          project_id: dto.projectId,
          reference: dto.reference,
          notes: dto.notes,
          created_by: userId,
        },
        include: { article: { select: { id: true, code: true, nom: true, unite: true } } },
      });
    });
  }

  /**
   * Invariant D8 (ADR-002) — jamais de stock négatif. Mise à jour conditionnelle atomique en une
   * seule instruction SQL (`WHERE quantite_disponible >= :q`) : la vérification et la
   * décrémentation sont indivisibles, pas une lecture séparée suivie d'une écriture. La requête
   * brute doit porter `organization_id` explicitement — l'extension tenant n'intercepte QUE les
   * opérations modèle (`$allModels.$allOperations`), jamais `$executeRaw` (cf. ARCHITECTURE.md §4.1).
   */
  private async sortie(dto: CreateStockMovementDto, userId: string) {
    const orgId = this.tenantPrisma.organizationId;
    return this.tenantPrisma.db.$transaction(async (tx) => {
      const lignesAffectees = await tx.$executeRaw`
        UPDATE "articles"
        SET quantite_disponible = quantite_disponible - ${dto.quantite}
        WHERE id = ${dto.articleId}
          AND organization_id = ${orgId}
          AND quantite_disponible >= ${dto.quantite}
      `;

      if (lignesAffectees === 0) {
        const article = await tx.article.findFirst({ where: { id: dto.articleId, organization_id: orgId } });
        if (!article) {
          throw new NotFoundException({ code: 'RESSOURCE_INTROUVABLE', message: 'Article introuvable.' });
        }
        throw new BadRequestException({
          code: 'STOCK_INSUFFISANT',
          message: `Quantité disponible (${article.quantite_disponible}) inférieure à la quantité demandée (${dto.quantite}).`,
        });
      }

      return tx.stockMovement.create({
        data: {
          organization_id: orgId,
          article_id: dto.articleId,
          type: TypeMouvementStock.SORTIE,
          quantite: dto.quantite,
          cout_unitaire: dto.coutUnitaire,
          project_id: dto.projectId,
          reference: dto.reference,
          notes: dto.notes,
          created_by: userId,
        },
        include: { article: { select: { id: true, code: true, nom: true, unite: true } } },
      });
    });
  }

  /** `dto.quantite` est ici la nouvelle quantité ABSOLUE, pas un delta — cf. CreateStockMovementDto. */
  private async ajustement(dto: CreateStockMovementDto, userId: string) {
    const orgId = this.tenantPrisma.organizationId;
    return this.tenantPrisma.db.$transaction(async (tx) => {
      const article = await tx.article.findFirst({ where: { id: dto.articleId, organization_id: orgId } });
      if (!article) {
        throw new NotFoundException({ code: 'RESSOURCE_INTROUVABLE', message: 'Article introuvable.' });
      }
      const delta = new Prisma.Decimal(dto.quantite).minus(article.quantite_disponible);

      await tx.article.update({ where: { id: dto.articleId }, data: { quantite_disponible: dto.quantite } });

      return tx.stockMovement.create({
        data: {
          organization_id: orgId,
          article_id: dto.articleId,
          type: TypeMouvementStock.AJUSTEMENT,
          quantite: delta.abs(),
          project_id: dto.projectId,
          reference: dto.reference,
          notes: dto.notes ?? `Ajustement : ${article.quantite_disponible} → ${dto.quantite}`,
          created_by: userId,
        },
        include: { article: { select: { id: true, code: true, nom: true, unite: true } } },
      });
    });
  }
}
