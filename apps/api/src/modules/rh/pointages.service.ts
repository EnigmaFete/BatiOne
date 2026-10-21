import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatutPresence } from '@batione/database';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { toDateOrUndefined } from '../../common/utils/date.util';
import { CreatePointageBatchDto } from './dto/create-pointage-batch.dto';

@Injectable()
export class PointagesService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async enregistrerBatch(dto: CreatePointageBatchDto) {
    const datePointage = toDateOrUndefined(dto.date_pointage);
    if (!datePointage) {
      throw new Error('Date de pointage invalide');
    }

    // Récupérer les taux des collaborateurs pour calculer le coût de la journée
    const workerIds = dto.lignes.map((l) => l.worker_id);
    const workers = await this.tenantPrisma.db.worker.findMany({
      where: { id: { in: workerIds } },
    });
    const workerMap = new Map(workers.map((w) => [w.id, w]));

    // Trouver ou créer le pointage d'en-tête pour cette date et ce projet
    let pointage = await this.tenantPrisma.db.pointage.findFirst({
      where: {
        date_pointage: datePointage,
        project_id: dto.project_id || null,
      },
    });

    if (!pointage) {
      pointage = await this.tenantPrisma.db.pointage.create({
        data: {
          organization_id: this.tenantPrisma.organizationId,
          date_pointage: datePointage,
          project_id: dto.project_id || null,
          notes: dto.notes?.trim() || null,
        },
      });
    } else if (dto.notes !== undefined) {
      pointage = await this.tenantPrisma.db.pointage.update({
        where: { id: pointage.id },
        data: { notes: dto.notes.trim() || null },
      });
    }

    // Traitement des lignes
    for (const ligne of dto.lignes) {
      const worker = workerMap.get(ligne.worker_id);
      let coutJournee = 0;

      if (worker) {
        const tauxJour = Number(worker.taux_journalier_mad) || 0;
        const tauxHeure = Number(worker.taux_horaire_mad) || (tauxJour > 0 ? tauxJour / 8 : 0);

        let fractionJour = 0;
        if (ligne.statut_presence === StatutPresence.PRESENT) {
          fractionJour = 1;
        } else if (ligne.statut_presence === StatutPresence.DEMI_JOURNEE) {
          fractionJour = 0.5;
        }

        const coutBase = fractionJour * tauxJour;
        const coutSup = (ligne.heures_sup || 0) * tauxHeure * 1.25;
        coutJournee = Math.round((coutBase + coutSup) * 100) / 100;
      }

      await this.tenantPrisma.db.pointageLigne.upsert({
        where: {
          pointage_id_worker_id: {
            pointage_id: pointage.id,
            worker_id: ligne.worker_id,
          },
        },
        create: {
          organization_id: this.tenantPrisma.organizationId,
          pointage_id: pointage.id,
          worker_id: ligne.worker_id,
          statut_presence: ligne.statut_presence,
          heures_normales: new Prisma.Decimal(ligne.heures_normales ?? 8),
          heures_sup: new Prisma.Decimal(ligne.heures_sup ?? 0),
          cout_journee_mad: new Prisma.Decimal(ligne.cout_journee_mad ?? coutJournee),
          notes: ligne.notes?.trim() || null,
        },
        update: {
          statut_presence: ligne.statut_presence,
          heures_normales: new Prisma.Decimal(ligne.heures_normales ?? 8),
          heures_sup: new Prisma.Decimal(ligne.heures_sup ?? 0),
          cout_journee_mad: new Prisma.Decimal(ligne.cout_journee_mad ?? coutJournee),
          notes: ligne.notes?.trim() || null,
        },
      });
    }

    return this.obtenirParDate(dto.date_pointage, dto.project_id);
  }

  async obtenirParDate(dateStr: string, projectId?: string) {
    const datePointage = toDateOrUndefined(dateStr);
    if (!datePointage) {
      throw new NotFoundException('Date invalide');
    }

    const [workersActifs, pointage] = await Promise.all([
      this.tenantPrisma.db.worker.findMany({
        where: { deleted_at: null, statut: 'ACTIF' },
        orderBy: [{ poste: 'asc' }, { nom: 'asc' }],
      }),
      this.tenantPrisma.db.pointage.findFirst({
        where: {
          date_pointage: datePointage,
          project_id: projectId || null,
        },
        include: {
          lignes: true,
          project: { select: { id: true, code: true, nom: true } },
        },
      }),
    ]);

    const ligneParWorker = new Map(pointage?.lignes.map((l) => [l.worker_id, l]) ?? []);

    const grille = workersActifs.map((worker) => {
      const ligne = ligneParWorker.get(worker.id);
      return {
        worker_id: worker.id,
        matricule: worker.matricule,
        nom: worker.nom,
        prenom: worker.prenom,
        poste: worker.poste,
        type_contrat: worker.type_contrat,
        taux_journalier_mad: worker.taux_journalier_mad,
        taux_horaire_mad: worker.taux_horaire_mad,
        statut_presence: ligne ? ligne.statut_presence : StatutPresence.PRESENT,
        heures_normales: ligne ? Number(ligne.heures_normales) : 8,
        heures_sup: ligne ? Number(ligne.heures_sup) : 0,
        cout_journee_mad: ligne ? Number(ligne.cout_journee_mad) : Number(worker.taux_journalier_mad),
        notes: ligne?.notes || '',
      };
    });

    return {
      date_pointage: dateStr,
      pointage_id: pointage?.id ?? null,
      project: pointage?.project ?? null,
      notes: pointage?.notes ?? '',
      total_ouvriers: workersActifs.length,
      presents: grille.filter((g) => g.statut_presence === StatutPresence.PRESENT).length,
      demi_journees: grille.filter((g) => g.statut_presence === StatutPresence.DEMI_JOURNEE).length,
      absents: grille.filter((g) => g.statut_presence === StatutPresence.ABSENT).length,
      cout_total_journee_mad: grille.reduce((acc, curr) => acc + (curr.cout_journee_mad || 0), 0),
      lignes: grille,
    };
  }

  async obtenirStatsMois(annee: number, mois: number) {
    const debutMois = new Date(annee, mois - 1, 1);
    const finMois = new Date(annee, mois, 0);

    const pointages = await this.tenantPrisma.db.pointage.findMany({
      where: {
        date_pointage: {
          gte: debutMois,
          lte: finMois,
        },
      },
      include: {
        lignes: true,
      },
    });

    // Agrégation par worker_id
    const stats = new Map<
      string,
      {
        jours_travailles: number;
        heures_sup: number;
        cout_total_mad: number;
      }
    >();

    for (const pointage of pointages) {
      for (const ligne of pointage.lignes) {
        const existant = stats.get(ligne.worker_id) || {
          jours_travailles: 0,
          heures_sup: 0,
          cout_total_mad: 0,
        };

        if (ligne.statut_presence === StatutPresence.PRESENT) {
          existant.jours_travailles += 1;
        } else if (ligne.statut_presence === StatutPresence.DEMI_JOURNEE) {
          existant.jours_travailles += 0.5;
        }

        existant.heures_sup += Number(ligne.heures_sup);
        existant.cout_total_mad += Number(ligne.cout_journee_mad);

        stats.set(ligne.worker_id, existant);
      }
    }

    return stats;
  }
}
