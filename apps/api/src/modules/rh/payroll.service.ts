import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatutOperationnel } from '@batione/database';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { ExtournePayslipDto } from './dto/extourne-payslip.dto';
import { PointagesService } from './pointages.service';
import { calculerPaieMarocaine } from './payroll-calculator';

@Injectable()
export class PayrollService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly pointagesService: PointagesService
  ) {}

  async genererMois(dto: GeneratePayrollDto) {
    const { periode_annee, periode_mois } = dto;

    // 1. Ouvriers actifs
    const workers = await this.tenantPrisma.db.worker.findMany({
      where: { deleted_at: null, statut: 'ACTIF' },
      orderBy: [{ poste: 'asc' }, { nom: 'asc' }],
    });

    // 2. Statistiques de pointage du mois
    const statsPointage = await this.pointagesService.obtenirStatsMois(
      periode_annee,
      periode_mois
    );

    // 3. Date limite pour les acomptes : fin du mois concerné
    const finMois = new Date(periode_annee, periode_mois, 0);

    const bulletinsGeneres = [];

    for (const worker of workers) {
      // Vérifier si un bulletin enregistré existe déjà
      const existant = await this.tenantPrisma.db.payslip.findFirst({
        where: {
          worker_id: worker.id,
          periode_annee,
          periode_mois,
        },
      });

      if (existant && (existant.statut === StatutOperationnel.ENREGISTRE || existant.statut === StatutOperationnel.EXTOURNE)) {
        bulletinsGeneres.push(existant);
        continue;
      }

      // Pointages réels ou jours par défaut si salarié mensuel sans pointage
      const stat = statsPointage.get(worker.id);
      let joursTravailles = stat ? stat.jours_travailles : 0;
      const heuresSup = stat ? stat.heures_sup : 0;

      // Si c'est un salarié mensuel (CDI/CDD) et qu'aucun pointage de chantier n'a été fait, par défaut 26 jours ouvrables
      if (
        (worker.type_contrat === 'CDI' || worker.type_contrat === 'CDD') &&
        joursTravailles === 0
      ) {
        joursTravailles = 26;
      }

      // Acomptes non déduits pris par ce travailleur jusqu'à la fin de ce mois
      const acomptes = await this.tenantPrisma.db.acompteWorker.findMany({
        where: {
          worker_id: worker.id,
          deduit_paie: false,
          date_acompte: { lte: finMois },
        },
      });
      const totalAcomptes = acomptes.reduce((acc, a) => acc + Number(a.montant_mad), 0);

      const calcul = calculerPaieMarocaine({
        type_contrat: worker.type_contrat,
        salaire_base_mad: Number(worker.salaire_base_mad),
        taux_journalier_mad: Number(worker.taux_journalier_mad),
        taux_horaire_mad: Number(worker.taux_horaire_mad),
        jours_travailles: joursTravailles,
        heures_sup: heuresSup,
        primes_mad: 0,
        nombre_deductions_ir: worker.nombre_deductions_ir,
        total_acomptes_mad: totalAcomptes,
      });

      const dataPayslip = {
        salaire_base_mad: new Prisma.Decimal(calcul.salaire_base_mad),
        jours_travailles: new Prisma.Decimal(calcul.jours_travailles),
        taux_journalier_applique_mad: new Prisma.Decimal(calcul.taux_journalier_applique_mad),
        heures_sup_heures: new Prisma.Decimal(calcul.heures_sup_heures),
        heures_sup_mad: new Prisma.Decimal(calcul.heures_sup_mad),
        primes_mad: new Prisma.Decimal(calcul.primes_mad),
        salaire_brut_mad: new Prisma.Decimal(calcul.salaire_brut_mad),
        cnss_salarie_mad: new Prisma.Decimal(calcul.cnss_salarie_mad),
        amo_salarie_mad: new Prisma.Decimal(calcul.amo_salarie_mad),
        ir_mad: new Prisma.Decimal(calcul.ir_mad),
        acomptes_deduits_mad: new Prisma.Decimal(calcul.acomptes_deduits_mad),
        salaire_net_mad: new Prisma.Decimal(calcul.salaire_net_mad),
        cnss_patronale_mad: new Prisma.Decimal(calcul.cnss_patronale_mad),
        amo_patronale_mad: new Prisma.Decimal(calcul.amo_patronale_mad),
        charges_patronales_mad: new Prisma.Decimal(calcul.charges_patronales_mad),
        cout_total_employeur_mad: new Prisma.Decimal(calcul.cout_total_employeur_mad),
        statut: StatutOperationnel.BROUILLON,
      };

      if (existant) {
        const misAJour = await this.tenantPrisma.db.payslip.update({
          where: { id: existant.id },
          data: dataPayslip,
        });
        bulletinsGeneres.push(misAJour);
      } else {
        const cree = await this.tenantPrisma.db.payslip.create({
          data: {
            organization_id: this.tenantPrisma.organizationId,
            worker_id: worker.id,
            periode_mois,
            periode_annee,
            ...dataPayslip,
          },
        });
        bulletinsGeneres.push(cree);
      }
    }

    return this.lister(periode_annee, periode_mois);
  }

  async lister(annee: number, mois: number) {
    const bulletins = await this.tenantPrisma.db.payslip.findMany({
      where: {
        periode_annee: annee,
        periode_mois: mois,
      },
      include: {
        worker: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            cin: true,
            cnss_num: true,
            poste: true,
            type_contrat: true,
            rib: true,
            banque: true,
          },
        },
      },
      orderBy: [{ worker: { poste: 'asc' } }, { worker: { nom: 'asc' } }],
    });

    const totaux = bulletins.reduce(
      (acc, b) => ({
        salaire_brut_total: acc.salaire_brut_total + Number(b.salaire_brut_mad),
        cnss_salarie_total: acc.cnss_salarie_total + Number(b.cnss_salarie_mad),
        amo_salarie_total: acc.amo_salarie_total + Number(b.amo_salarie_mad),
        ir_total: acc.ir_total + Number(b.ir_mad),
        acomptes_total: acc.acomptes_total + Number(b.acomptes_deduits_mad),
        salaire_net_total: acc.salaire_net_total + Number(b.salaire_net_mad),
        charges_patronales_total: acc.charges_patronales_total + Number(b.charges_patronales_mad),
        cout_employeur_total: acc.cout_employeur_total + Number(b.cout_total_employeur_mad),
      }),
      {
        salaire_brut_total: 0,
        cnss_salarie_total: 0,
        amo_salarie_total: 0,
        ir_total: 0,
        acomptes_total: 0,
        salaire_net_total: 0,
        charges_patronales_total: 0,
        cout_employeur_total: 0,
      }
    );

    return {
      periode_annee: annee,
      periode_mois: mois,
      total_bulletins: bulletins.length,
      totaux,
      bulletins,
    };
  }

  async obtenir(id: string) {
    const payslip = await this.tenantPrisma.db.payslip.findUnique({
      where: { id },
      include: {
        worker: true,
        organization: {
          select: {
            id: true,
            nom: true,
            ice: true,
            if_num: true,
            rc: true,
            cnss_employeur: true,
            patente: true,
            adresse: true,
            ville: true,
            telephone: true,
            email: true,
            logo_url: true,
          },
        },
        acomptes: true,
        extourne: true,
        extourneDe: true,
      },
    });

    if (!payslip) {
      throw new NotFoundException(`Bulletin ${id} introuvable.`);
    }

    return payslip;
  }

  async soumettre(id: string, userId: string) {
    const payslip = await this.obtenir(id);
    if (payslip.statut !== StatutOperationnel.BROUILLON) {
      throw new BadRequestException('Seul un bulletin en état BROUILLON peut être soumis.');
    }

    return this.tenantPrisma.db.payslip.update({
      where: { id },
      data: {
        statut: StatutOperationnel.SOUMIS,
        soumis_par_id: userId,
        soumis_le: new Date(),
        motif_rejet: null,
      },
    });
  }

  async approuver(id: string, userId: string) {
    const payslip = await this.obtenir(id);
    if (payslip.statut !== StatutOperationnel.SOUMIS) {
      throw new BadRequestException('Seul un bulletin en état SOUMIS peut être approuvé.');
    }

    if (payslip.soumis_par_id === userId) {
      throw new ForbiddenException(
        'SEPARATION_DES_TACHES: Vous ne pouvez pas approuver un bulletin que vous avez vous-même soumis.'
      );
    }

    return this.tenantPrisma.db.payslip.update({
      where: { id },
      data: {
        statut: StatutOperationnel.APPROUVE,
        approuve_par_id: userId,
        approuve_le: new Date(),
      },
    });
  }

  async rejeter(id: string, motif: string) {
    const payslip = await this.obtenir(id);
    if (payslip.statut !== StatutOperationnel.SOUMIS) {
      throw new BadRequestException('Seul un bulletin en état SOUMIS peut être rejeté.');
    }

    return this.tenantPrisma.db.payslip.update({
      where: { id },
      data: {
        statut: StatutOperationnel.BROUILLON,
        motif_rejet: motif,
        soumis_par_id: null,
        soumis_le: null,
      },
    });
  }

  async enregistrer(id: string) {
    const payslip = await this.obtenir(id);
    if (payslip.statut !== StatutOperationnel.APPROUVE) {
      throw new BadRequestException('Seul un bulletin en état APPROUVE peut être enregistré.');
    }

    // Scellement du bulletin et verrouillage des acomptes associés
    const enregistre = await this.tenantPrisma.db.payslip.update({
      where: { id },
      data: {
        statut: StatutOperationnel.ENREGISTRE,
        enregistre_le: new Date(),
      },
    });

    // Marquer les acomptes non encore déduits pris par ce travailleur jusqu'à cette période
    const finMois = new Date(payslip.periode_annee, payslip.periode_mois, 0);
    await this.tenantPrisma.db.acompteWorker.updateMany({
      where: {
        worker_id: payslip.worker_id,
        deduit_paie: false,
        date_acompte: { lte: finMois },
      },
      data: {
        deduit_paie: true,
        payslip_id: payslip.id,
      },
    });

    return enregistre;
  }

  async extourner(id: string, userId: string, dto: ExtournePayslipDto) {
    const payslip = await this.obtenir(id);
    if (payslip.statut !== StatutOperationnel.ENREGISTRE) {
      throw new BadRequestException('Seul un bulletin en état ENREGISTRE peut faire l’objet d’une extourne.');
    }

    if (payslip.extourne) {
      throw new ConflictException('Ce bulletin a déjà fait l’objet d’une extourne.');
    }

    // Création de l'écriture symétrique inverse
    const extourne = await this.tenantPrisma.db.payslip.create({
      data: {
        organization_id: this.tenantPrisma.organizationId,
        worker_id: payslip.worker_id,
        periode_annee: payslip.periode_annee,
        periode_mois: payslip.periode_mois,
        salaire_base_mad: payslip.salaire_base_mad.negated(),
        jours_travailles: payslip.jours_travailles.negated(),
        taux_journalier_applique_mad: payslip.taux_journalier_applique_mad,
        heures_sup_heures: payslip.heures_sup_heures.negated(),
        heures_sup_mad: payslip.heures_sup_mad.negated(),
        primes_mad: payslip.primes_mad.negated(),
        salaire_brut_mad: payslip.salaire_brut_mad.negated(),
        cnss_salarie_mad: payslip.cnss_salarie_mad.negated(),
        amo_salarie_mad: payslip.amo_salarie_mad.negated(),
        ir_mad: payslip.ir_mad.negated(),
        acomptes_deduits_mad: payslip.acomptes_deduits_mad.negated(),
        salaire_net_mad: payslip.salaire_net_mad.negated(),
        cnss_patronale_mad: payslip.cnss_patronale_mad.negated(),
        amo_patronale_mad: payslip.amo_patronale_mad.negated(),
        charges_patronales_mad: payslip.charges_patronales_mad.negated(),
        cout_total_employeur_mad: payslip.cout_total_employeur_mad.negated(),
        statut: StatutOperationnel.EXTOURNE,
        extourne_de_id: payslip.id,
        motif_extourne: dto.motif_extourne.trim(),
        created_by: userId,
      },
    });

    // Libérer les acomptes pour qu'ils puissent être rattachés à une future paie
    await this.tenantPrisma.db.acompteWorker.updateMany({
      where: { payslip_id: payslip.id },
      data: { deduit_paie: false, payslip_id: null },
    });

    return extourne;
  }
}
