import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@batione/database';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { toDateOrUndefined } from '../../common/utils/date.util';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';

const TENTATIVES_CODE_MAX = 3;

const INCLUSION_STANDARD = {
  responsable: { select: { id: true, nom: true, prenom: true } },
  client: { select: { id: true, nom: true, type: true } },
} satisfies Prisma.ProjectInclude;

@Injectable()
export class ProjectsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async lister(query: ListProjectsQueryDto) {
    const page = query.page ?? 1;
    const limite = query.limite ?? 25;

    const where: Prisma.ProjectWhereInput = {
      deleted_at: null,
      ...(query.statut ? { statut: query.statut } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.recherche
        ? {
            OR: [
              { nom: { contains: query.recherche, mode: 'insensitive' } },
              { code: { contains: query.recherche, mode: 'insensitive' } },
              { client: { nom: { contains: query.recherche, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [projets, total] = await Promise.all([
      this.tenantPrisma.db.project.findMany({
        where,
        include: INCLUSION_STANDARD,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limite,
        take: limite,
      }),
      this.tenantPrisma.db.project.count({ where }),
    ]);

    return {
      donnees: projets,
      metadonnees: { page, limite, total, total_pages: Math.max(1, Math.ceil(total / limite)) },
    };
  }

  async obtenir(id: string) {
    const projet = await this.tenantPrisma.db.project.findFirst({
      where: { id, deleted_at: null },
      include: INCLUSION_STANDARD,
    });
    if (!projet) {
      throw new NotFoundException({ code: 'RESSOURCE_INTROUVABLE', message: 'Projet introuvable.' });
    }
    return projet;
  }

  async creer(dto: CreateProjectDto, userId: string) {
    for (let tentative = 0; tentative < TENTATIVES_CODE_MAX; tentative += 1) {
      const code = await this.genererProchainCode();
      try {
        return await this.tenantPrisma.db.project.create({
          data: {
            organization_id: this.tenantPrisma.organizationId,
            code,
            nom: dto.nom,
            type: dto.type,
            client_id: dto.clientId,
            responsable_id: dto.responsableId,
            budget: dto.budget ?? 0,
            date_debut: toDateOrUndefined(dto.dateDebut),
            date_fin_prevue: toDateOrUndefined(dto.dateFinPrevue),
            description: dto.description,
            created_by: userId,
            updated_by: userId,
          },
          include: INCLUSION_STANDARD,
        });
      } catch (error) {
        // P2002 = violation de contrainte unique (organization_id, code) : collision rare sur
        // générations concurrentes — on retente avec un nouveau code plutôt que d'échouer.
        const estCollisionCode = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        if (!estCollisionCode || tentative === TENTATIVES_CODE_MAX - 1) {
          throw error;
        }
      }
    }
    throw new Error('Génération du code projet impossible après plusieurs tentatives.');
  }

  async mettreAJour(id: string, dto: UpdateProjectDto, userId: string) {
    await this.obtenir(id);
    return this.tenantPrisma.db.project.update({
      where: { id },
      data: {
        nom: dto.nom,
        type: dto.type,
        statut: dto.statut,
        client_id: dto.clientId,
        responsable_id: dto.responsableId,
        budget: dto.budget,
        date_debut: toDateOrUndefined(dto.dateDebut),
        date_fin_prevue: toDateOrUndefined(dto.dateFinPrevue),
        date_fin_reelle: toDateOrUndefined(dto.dateFinReelle),
        description: dto.description,
        updated_by: userId,
      },
      include: INCLUSION_STANDARD,
    });
  }

  async archiver(id: string, userId: string) {
    await this.obtenir(id);
    await this.tenantPrisma.db.project.update({
      where: { id },
      data: { deleted_at: new Date(), updated_by: userId },
    });
  }

  private async genererProchainCode(): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.tenantPrisma.db.project.count({
      where: { created_at: { gte: new Date(`${annee}-01-01T00:00:00.000Z`) } },
    });
    return `PRJ-${annee}-${String(count + 1).padStart(3, '0')}`;
  }
}
