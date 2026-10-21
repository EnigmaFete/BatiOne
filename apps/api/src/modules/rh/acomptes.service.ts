import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@batione/database';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { toDateOrUndefined } from '../../common/utils/date.util';
import { CreateAcompteDto } from './dto/create-acompte.dto';

@Injectable()
export class AcomptesService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async creer(dto: CreateAcompteDto) {
    const worker = await this.tenantPrisma.db.worker.findFirst({
      where: { id: dto.worker_id, deleted_at: null },
    });
    if (!worker) {
      throw new NotFoundException(`Collaborateur ${dto.worker_id} introuvable.`);
    }

    const dateAcompte = toDateOrUndefined(dto.date_acompte);
    if (!dateAcompte) {
      throw new BadRequestException('Date d’acompte invalide');
    }

    return this.tenantPrisma.db.acompteWorker.create({
      data: {
        organization_id: this.tenantPrisma.organizationId,
        worker_id: dto.worker_id,
        project_id: dto.project_id || null,
        date_acompte: dateAcompte,
        montant_mad: new Prisma.Decimal(dto.montant_mad),
        mode_paiement: dto.mode_paiement,
        motif: dto.motif?.trim() || null,
      },
      include: {
        worker: { select: { id: true, matricule: true, nom: true, prenom: true } },
        project: { select: { id: true, code: true, nom: true } },
      },
    });
  }

  async lister(query?: { worker_id?: string; non_deduits?: boolean }) {
    const where: Prisma.AcompteWorkerWhereInput = {
      ...(query?.worker_id ? { worker_id: query.worker_id } : {}),
      ...(query?.non_deduits ? { deduit_paie: false } : {}),
    };

    return this.tenantPrisma.db.acompteWorker.findMany({
      where,
      orderBy: { date_acompte: 'desc' },
      include: {
        worker: { select: { id: true, matricule: true, nom: true, prenom: true, poste: true } },
        project: { select: { id: true, code: true, nom: true } },
      },
    });
  }

  async supprimer(id: string) {
    const acompte = await this.tenantPrisma.db.acompteWorker.findUnique({
      where: { id },
    });
    if (!acompte) {
      throw new NotFoundException(`Acompte ${id} introuvable.`);
    }
    if (acompte.deduit_paie) {
      throw new BadRequestException('Impossible de supprimer un acompte déjà déduit sur un bulletin de paie.');
    }

    return this.tenantPrisma.db.acompteWorker.delete({
      where: { id },
    });
  }
}
