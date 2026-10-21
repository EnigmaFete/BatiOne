import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatutEquipement } from '@batione/database';
import { toDateOrUndefined } from '../../common/utils/date.util';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { ListEquipmentQueryDto } from './dto/list-equipment-query.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class EquipmentService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async lister(query: ListEquipmentQueryDto) {
    const page = query.page ?? 1;
    const limite = query.limite ?? 25;

    const where: Prisma.EquipmentWhereInput = {
      deleted_at: null,
      ...(query.statut ? { statut: query.statut } : {}),
      ...(query.recherche
        ? {
            OR: [
              { nom: { contains: query.recherche, mode: 'insensitive' } },
              { code: { contains: query.recherche, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [equipements, total] = await Promise.all([
      this.tenantPrisma.db.equipment.findMany({ where, orderBy: { nom: 'asc' }, skip: (page - 1) * limite, take: limite }),
      this.tenantPrisma.db.equipment.count({ where }),
    ]);

    return {
      donnees: equipements,
      metadonnees: { page, limite, total, total_pages: Math.max(1, Math.ceil(total / limite)) },
    };
  }

  async obtenir(id: string) {
    const equipement = await this.tenantPrisma.db.equipment.findFirst({
      where: { id, deleted_at: null },
      include: {
        affectations: {
          orderBy: { date_debut: 'desc' },
          take: 20,
          include: { project: { select: { id: true, code: true, nom: true } } },
        },
      },
    });
    if (!equipement) {
      throw new NotFoundException({ code: 'RESSOURCE_INTROUVABLE', message: 'Équipement introuvable.' });
    }
    return equipement;
  }

  async creer(dto: CreateEquipmentDto, userId: string) {
    const code = await this.genererProchainCode();
    return this.tenantPrisma.db.equipment.create({
      data: {
        organization_id: this.tenantPrisma.organizationId,
        code,
        nom: dto.nom,
        categorie: dto.categorie,
        cout_horaire_interne: dto.coutHoraireInterne ?? 0,
        notes: dto.notes,
        created_by: userId,
        updated_by: userId,
      },
    });
  }

  async mettreAJour(id: string, dto: UpdateEquipmentDto, userId: string) {
    await this.obtenir(id);
    return this.tenantPrisma.db.equipment.update({
      where: { id },
      data: {
        nom: dto.nom,
        categorie: dto.categorie,
        statut: dto.statut,
        cout_horaire_interne: dto.coutHoraireInterne,
        notes: dto.notes,
        updated_by: userId,
      },
    });
  }

  async archiver(id: string, userId: string) {
    await this.obtenir(id);
    await this.tenantPrisma.db.equipment.update({ where: { id }, data: { deleted_at: new Date(), updated_by: userId } });
  }

  async affecter(equipmentId: string, dto: CreateAssignmentDto, userId: string) {
    const orgId = this.tenantPrisma.organizationId;
    return this.tenantPrisma.db.$transaction(async (tx) => {
      const equipement = await tx.equipment.findFirst({ where: { id: equipmentId, organization_id: orgId, deleted_at: null } });
      if (!equipement) {
        throw new NotFoundException({ code: 'RESSOURCE_INTROUVABLE', message: 'Équipement introuvable.' });
      }
      if (equipement.statut !== StatutEquipement.DISPONIBLE) {
        throw new BadRequestException({
          code: 'EQUIPEMENT_NON_DISPONIBLE',
          message: `Cet équipement n'est pas disponible (statut actuel : "${equipement.statut}").`,
        });
      }

      const affectation = await tx.equipmentAssignment.create({
        data: {
          organization_id: orgId,
          equipment_id: equipmentId,
          project_id: dto.projectId,
          date_debut: new Date(dto.dateDebut),
          date_retour_prevu: toDateOrUndefined(dto.dateRetourPrevu),
          notes: dto.notes,
          created_by: userId,
        },
        include: { project: { select: { id: true, code: true, nom: true } } },
      });

      await tx.equipment.update({ where: { id: equipmentId }, data: { statut: StatutEquipement.AFFECTE, updated_by: userId } });

      return affectation;
    });
  }

  async retourner(equipmentId: string, assignmentId: string, userId: string) {
    const orgId = this.tenantPrisma.organizationId;
    return this.tenantPrisma.db.$transaction(async (tx) => {
      const affectation = await tx.equipmentAssignment.findFirst({
        where: { id: assignmentId, equipment_id: equipmentId, organization_id: orgId },
      });
      if (!affectation) {
        throw new NotFoundException({ code: 'RESSOURCE_INTROUVABLE', message: 'Affectation introuvable.' });
      }
      if (affectation.date_retour_reel) {
        throw new BadRequestException({ code: 'DEJA_RETOURNE', message: 'Cette affectation a déjà été clôturée.' });
      }

      const miseAJour = await tx.equipmentAssignment.update({
        where: { id: assignmentId },
        data: { date_retour_reel: new Date() },
        include: { project: { select: { id: true, code: true, nom: true } } },
      });

      await tx.equipment.update({
        where: { id: equipmentId },
        data: { statut: StatutEquipement.DISPONIBLE, updated_by: userId },
      });

      return miseAJour;
    });
  }

  private async genererProchainCode(): Promise<string> {
    const count = await this.tenantPrisma.db.equipment.count();
    return `EQ-${String(count + 1).padStart(4, '0')}`;
  }
}
