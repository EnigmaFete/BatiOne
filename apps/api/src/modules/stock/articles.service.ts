import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@batione/database';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';

@Injectable()
export class ArticlesService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async lister(query: ListArticlesQueryDto) {
    const page = query.page ?? 1;
    const limite = query.limite ?? 25;

    const where: Prisma.ArticleWhereInput = {
      deleted_at: null,
      ...(query.recherche
        ? {
            OR: [
              { nom: { contains: query.recherche, mode: 'insensitive' } },
              { code: { contains: query.recherche, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [articles, total] = await Promise.all([
      this.tenantPrisma.db.article.findMany({
        where,
        orderBy: { nom: 'asc' },
        skip: (page - 1) * limite,
        take: limite,
      }),
      this.tenantPrisma.db.article.count({ where }),
    ]);

    return {
      donnees: articles,
      metadonnees: { page, limite, total, total_pages: Math.max(1, Math.ceil(total / limite)) },
    };
  }

  /** Liste légère pour peupler un sélecteur (mouvements de stock). */
  async listerPourSelection() {
    return this.tenantPrisma.db.article.findMany({
      where: { deleted_at: null },
      select: { id: true, nom: true, unite: true, quantite_disponible: true },
      orderBy: { nom: 'asc' },
    });
  }

  async obtenir(id: string) {
    const article = await this.tenantPrisma.db.article.findFirst({
      where: { id, deleted_at: null },
      include: { mouvements: { orderBy: { created_at: 'desc' }, take: 20, include: { project: { select: { id: true, code: true, nom: true } } } } },
    });
    if (!article) {
      throw new NotFoundException({ code: 'RESSOURCE_INTROUVABLE', message: 'Article introuvable.' });
    }
    return article;
  }

  async creer(dto: CreateArticleDto, userId: string) {
    const code = await this.genererProchainCode();
    try {
      return await this.tenantPrisma.db.article.create({
        data: {
          organization_id: this.tenantPrisma.organizationId,
          code,
          nom: dto.nom,
          categorie: dto.categorie,
          unite: dto.unite ?? 'u',
          prix_unitaire: dto.prixUnitaire ?? 0,
          seuil_alerte: dto.seuilAlerte ?? 0,
          created_by: userId,
          updated_by: userId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({ code: 'CODE_DEJA_UTILISE', message: 'Un article avec ce code existe déjà.' });
      }
      throw error;
    }
  }

  async mettreAJour(id: string, dto: UpdateArticleDto, userId: string) {
    await this.obtenir(id);
    return this.tenantPrisma.db.article.update({
      where: { id },
      data: {
        nom: dto.nom,
        categorie: dto.categorie,
        unite: dto.unite,
        prix_unitaire: dto.prixUnitaire,
        seuil_alerte: dto.seuilAlerte,
        updated_by: userId,
      },
    });
  }

  async archiver(id: string, userId: string) {
    await this.obtenir(id);
    await this.tenantPrisma.db.article.update({
      where: { id },
      data: { deleted_at: new Date(), updated_by: userId },
    });
  }

  private async genererProchainCode(): Promise<string> {
    const count = await this.tenantPrisma.db.article.count();
    return `ART-${String(count + 1).padStart(4, '0')}`;
  }
}
