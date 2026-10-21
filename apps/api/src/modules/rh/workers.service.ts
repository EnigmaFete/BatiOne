import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@batione/database';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { toDateOrUndefined } from '../../common/utils/date.util';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { FilterWorkersDto } from './dto/filter-workers.dto';

@Injectable()
export class WorkersService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  private async genererMatricule(): Promise<string> {
    const count = await this.tenantPrisma.db.worker.count();
    const sequence = String(count + 1).padStart(3, '0');
    return `TRV-${sequence}`;
  }

  async creer(dto: CreateWorkerDto) {
    const cinNormalise = dto.cin?.trim().toUpperCase() || undefined;

    if (cinNormalise) {
      const existant = await this.tenantPrisma.db.worker.findFirst({
        where: { cin: cinNormalise, deleted_at: null },
      });
      if (existant) {
        throw new ConflictException(
          `Un travailleur avec le CIN ${cinNormalise} existe déjà dans cette entreprise.`
        );
      }
    }

    const matricule = dto.matricule?.trim() || (await this.genererMatricule());

    const worker = await this.tenantPrisma.db.worker.create({
      data: {
        organization_id: this.tenantPrisma.organizationId,
        matricule,
        nom: dto.nom.trim(),
        prenom: dto.prenom.trim(),
        cin: cinNormalise,
        cnss_num: dto.cnss_num?.trim() || undefined,
        telephone: dto.telephone?.trim() || undefined,
        email: dto.email?.trim().toLowerCase() || undefined,
        poste: dto.poste.trim(),
        departement: dto.departement?.trim() || undefined,
        type_contrat: dto.type_contrat,
        date_embauche: toDateOrUndefined(dto.date_embauche),
        date_fin_contrat: toDateOrUndefined(dto.date_fin_contrat),
        salaire_base_mad: dto.salaire_base_mad !== undefined ? new Prisma.Decimal(dto.salaire_base_mad) : undefined,
        taux_journalier_mad: dto.taux_journalier_mad !== undefined ? new Prisma.Decimal(dto.taux_journalier_mad) : undefined,
        taux_horaire_mad: dto.taux_horaire_mad !== undefined ? new Prisma.Decimal(dto.taux_horaire_mad) : undefined,
        banque: dto.banque?.trim() || undefined,
        rib: dto.rib?.trim() || undefined,
        nombre_deductions_ir: dto.nombre_deductions_ir ?? 0,
        adresse: dto.adresse?.trim() || undefined,
        ville: dto.ville?.trim() || 'Casablanca',
        contact_urgence_nom: dto.contact_urgence_nom?.trim() || undefined,
        contact_urgence_tel: dto.contact_urgence_tel?.trim() || undefined,
        notes: dto.notes?.trim() || undefined,
      },
    });

    return worker;
  }

  async lister(query: FilterWorkersDto) {
    const page = query.page ?? 1;
    const limite = query.limite ?? 50;

    const where: Prisma.WorkerWhereInput = {
      deleted_at: null,
      ...(query.statut ? { statut: query.statut } : {}),
      ...(query.type_contrat ? { type_contrat: query.type_contrat } : {}),
      ...(query.poste ? { poste: { contains: query.poste, mode: 'insensitive' } } : {}),
      ...(query.recherche
        ? {
            OR: [
              { nom: { contains: query.recherche, mode: 'insensitive' } },
              { prenom: { contains: query.recherche, mode: 'insensitive' } },
              { matricule: { contains: query.recherche, mode: 'insensitive' } },
              { cin: { contains: query.recherche, mode: 'insensitive' } },
              { telephone: { contains: query.recherche, mode: 'insensitive' } },
              { poste: { contains: query.recherche, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [workers, total] = await Promise.all([
      this.tenantPrisma.db.worker.findMany({
        where,
        orderBy: [{ statut: 'asc' }, { nom: 'asc' }],
        skip: (page - 1) * limite,
        take: limite,
      }),
      this.tenantPrisma.db.worker.count({ where }),
    ]);

    return {
      donnees: workers,
      metadonnees: {
        page,
        limite,
        total,
        total_pages: Math.max(1, Math.ceil(total / limite)),
      },
    };
  }

  async listerPourSelection() {
    return this.tenantPrisma.db.worker.findMany({
      where: { deleted_at: null, statut: 'ACTIF' },
      select: {
        id: true,
        matricule: true,
        nom: true,
        prenom: true,
        poste: true,
        type_contrat: true,
        taux_journalier_mad: true,
        salaire_base_mad: true,
      },
      orderBy: { nom: 'asc' },
    });
  }

  async obtenir(id: string) {
    const worker = await this.tenantPrisma.db.worker.findFirst({
      where: { id, deleted_at: null },
      include: {
        acomptes: {
          orderBy: { date_acompte: 'desc' },
          take: 10,
        },
        payslips: {
          orderBy: [{ periode_annee: 'desc' }, { periode_mois: 'desc' }],
          take: 12,
        },
      },
    });

    if (!worker) {
      throw new NotFoundException(`Collaborateur avec l’identifiant ${id} introuvable.`);
    }

    return worker;
  }

  async modifier(id: string, dto: UpdateWorkerDto) {
    await this.obtenir(id);

    const cinNormalise = dto.cin !== undefined ? dto.cin.trim().toUpperCase() || null : undefined;

    if (cinNormalise) {
      const existant = await this.tenantPrisma.db.worker.findFirst({
        where: { cin: cinNormalise, deleted_at: null, id: { not: id } },
      });
      if (existant) {
        throw new ConflictException(
          `Un collaborateur avec le CIN ${cinNormalise} existe déjà dans cette entreprise.`
        );
      }
    }

    return this.tenantPrisma.db.worker.update({
      where: { id },
      data: {
        ...(dto.matricule !== undefined ? { matricule: dto.matricule.trim() } : {}),
        ...(dto.nom !== undefined ? { nom: dto.nom.trim() } : {}),
        ...(dto.prenom !== undefined ? { prenom: dto.prenom.trim() } : {}),
        ...(dto.cin !== undefined ? { cin: cinNormalise } : {}),
        ...(dto.cnss_num !== undefined ? { cnss_num: dto.cnss_num?.trim() || null } : {}),
        ...(dto.telephone !== undefined ? { telephone: dto.telephone?.trim() || null } : {}),
        ...(dto.email !== undefined ? { email: dto.email?.trim().toLowerCase() || null } : {}),
        ...(dto.poste !== undefined ? { poste: dto.poste.trim() } : {}),
        ...(dto.departement !== undefined ? { departement: dto.departement?.trim() || null } : {}),
        ...(dto.type_contrat !== undefined ? { type_contrat: dto.type_contrat } : {}),
        ...(dto.statut !== undefined ? { statut: dto.statut } : {}),
        ...(dto.date_embauche !== undefined ? { date_embauche: toDateOrUndefined(dto.date_embauche) || null } : {}),
        ...(dto.date_fin_contrat !== undefined ? { date_fin_contrat: toDateOrUndefined(dto.date_fin_contrat) || null } : {}),
        ...(dto.salaire_base_mad !== undefined ? { salaire_base_mad: new Prisma.Decimal(dto.salaire_base_mad) } : {}),
        ...(dto.taux_journalier_mad !== undefined ? { taux_journalier_mad: new Prisma.Decimal(dto.taux_journalier_mad) } : {}),
        ...(dto.taux_horaire_mad !== undefined ? { taux_horaire_mad: new Prisma.Decimal(dto.taux_horaire_mad) } : {}),
        ...(dto.banque !== undefined ? { banque: dto.banque?.trim() || null } : {}),
        ...(dto.rib !== undefined ? { rib: dto.rib?.trim() || null } : {}),
        ...(dto.nombre_deductions_ir !== undefined ? { nombre_deductions_ir: dto.nombre_deductions_ir } : {}),
        ...(dto.adresse !== undefined ? { adresse: dto.adresse?.trim() || null } : {}),
        ...(dto.ville !== undefined ? { ville: dto.ville?.trim() || null } : {}),
        ...(dto.contact_urgence_nom !== undefined ? { contact_urgence_nom: dto.contact_urgence_nom?.trim() || null } : {}),
        ...(dto.contact_urgence_tel !== undefined ? { contact_urgence_tel: dto.contact_urgence_tel?.trim() || null } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
      },
    });
  }

  async archiver(id: string) {
    await this.obtenir(id);
    return this.tenantPrisma.db.worker.update({
      where: { id },
      data: { deleted_at: new Date(), statut: 'INACTIF' },
    });
  }
}
