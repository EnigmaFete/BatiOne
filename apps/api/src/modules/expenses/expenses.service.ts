import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatutOperationnel } from '@batione/database';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { toDateOrUndefined } from '../../common/utils/date.util';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ListExpensesQueryDto } from './dto/list-expenses-query.dto';
import { MotifDto } from './dto/motif.dto';

const INCLUSION_STANDARD = {
  categorie: { select: { id: true, nom: true } },
  project: { select: { id: true, code: true, nom: true } },
} satisfies Prisma.ExpenseInclude;

@Injectable()
export class ExpensesService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async lister(query: ListExpensesQueryDto) {
    const page = query.page ?? 1;
    const limite = query.limite ?? 25;

    const where: Prisma.ExpenseWhereInput = {
      ...(query.statut ? { statut: query.statut } : {}),
      ...(query.projectId ? { project_id: query.projectId } : {}),
      ...(query.categorieId ? { categorie_id: query.categorieId } : {}),
      ...(query.recherche
        ? {
            OR: [
              { fournisseur: { contains: query.recherche, mode: 'insensitive' } },
              { reference_piece: { contains: query.recherche, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [depenses, total] = await Promise.all([
      this.tenantPrisma.db.expense.findMany({
        where,
        include: INCLUSION_STANDARD,
        orderBy: { date_depense: 'desc' },
        skip: (page - 1) * limite,
        take: limite,
      }),
      this.tenantPrisma.db.expense.count({ where }),
    ]);

    return {
      donnees: depenses,
      metadonnees: { page, limite, total, total_pages: Math.max(1, Math.ceil(total / limite)) },
    };
  }

  async obtenir(id: string) {
    const depense = await this.tenantPrisma.db.expense.findUnique({
      where: { id },
      include: { ...INCLUSION_STANDARD, extourne: { select: { id: true, statut: true } } },
    });
    if (!depense) {
      throw new NotFoundException({ code: 'RESSOURCE_INTROUVABLE', message: 'Dépense introuvable.' });
    }
    return depense;
  }

  async creer(dto: CreateExpenseDto, userId: string, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existante = await this.tenantPrisma.db.expense.findUnique({
        where: { organization_id_idempotency_key: { organization_id: this.tenantPrisma.organizationId, idempotency_key: idempotencyKey } },
      });
      if (existante) return existante;
    }

    return this.tenantPrisma.db.expense.create({
      data: {
        organization_id: this.tenantPrisma.organizationId,
        date_depense: new Date(dto.dateDepense),
        montant_ht: dto.montantHt,
        categorie_id: dto.categorieId,
        project_id: dto.projectId,
        fournisseur: dto.fournisseur,
        mode_paiement: dto.modePaiement,
        reference_piece: dto.referencePiece,
        notes: dto.notes,
        idempotency_key: idempotencyKey,
        created_by: userId,
        updated_by: userId,
      },
      include: INCLUSION_STANDARD,
    });
  }

  async mettreAJour(id: string, dto: UpdateExpenseDto, userId: string) {
    const depense = await this.obtenirBrute(id);
    this.exigerStatut(depense, StatutOperationnel.BROUILLON, 'STATUT_INVALIDE_POUR_MODIFICATION', 'modifiée');

    return this.tenantPrisma.db.expense.update({
      where: { id },
      data: {
        date_depense: toDateOrUndefined(dto.dateDepense),
        montant_ht: dto.montantHt,
        categorie_id: dto.categorieId,
        project_id: dto.projectId,
        fournisseur: dto.fournisseur,
        mode_paiement: dto.modePaiement,
        reference_piece: dto.referencePiece,
        notes: dto.notes,
        updated_by: userId,
      },
      include: INCLUSION_STANDARD,
    });
  }

  async soumettre(id: string, userId: string) {
    const depense = await this.obtenirBrute(id);
    this.exigerStatut(depense, StatutOperationnel.BROUILLON, 'STATUT_INVALIDE_POUR_SOUMISSION', 'soumise');

    return this.tenantPrisma.db.expense.update({
      where: { id },
      data: {
        statut: StatutOperationnel.SOUMIS,
        soumis_par_id: userId,
        soumis_le: new Date(),
        motif_rejet: null,
        updated_by: userId,
      },
      include: INCLUSION_STANDARD,
    });
  }

  async approuver(id: string, userId: string) {
    const depense = await this.obtenirBrute(id);
    this.exigerStatut(depense, StatutOperationnel.SOUMIS, 'STATUT_INVALIDE_POUR_APPROBATION', 'approuvée');

    // Séparation des tâches (ADR-003 D4) : vérification serveur indépendante du rôle RBAC.
    if (depense.soumis_par_id === userId) {
      throw new ForbiddenException({
        code: 'SEPARATION_DES_TACHES',
        message: 'Vous ne pouvez pas approuver une dépense que vous avez vous-même soumise.',
      });
    }

    return this.tenantPrisma.db.expense.update({
      where: { id },
      data: {
        statut: StatutOperationnel.APPROUVE,
        approuve_par_id: userId,
        approuve_le: new Date(),
        updated_by: userId,
      },
      include: INCLUSION_STANDARD,
    });
  }

  async rejeter(id: string, dto: MotifDto, userId: string) {
    const depense = await this.obtenirBrute(id);
    this.exigerStatut(depense, StatutOperationnel.SOUMIS, 'STATUT_INVALIDE_POUR_REJET', 'rejetée');

    return this.tenantPrisma.db.expense.update({
      where: { id },
      data: {
        statut: StatutOperationnel.BROUILLON,
        motif_rejet: dto.motif,
        soumis_par_id: null,
        soumis_le: null,
        updated_by: userId,
      },
      include: INCLUSION_STANDARD,
    });
  }

  async enregistrer(id: string, userId: string) {
    const depense = await this.obtenirBrute(id);
    this.exigerStatut(depense, StatutOperationnel.APPROUVE, 'STATUT_INVALIDE_POUR_ENREGISTREMENT', 'enregistrée');

    return this.tenantPrisma.db.expense.update({
      where: { id },
      data: {
        statut: StatutOperationnel.ENREGISTRE,
        enregistre_le: new Date(),
        updated_by: userId,
      },
      include: INCLUSION_STANDARD,
    });
  }

  /**
   * Extourne (ADR-003 D5/D6) : l'original reste ENREGISTRE pour toujours — on crée une NOUVELLE
   * ligne symétrique inverse (montant négatif) pointant vers lui, jamais une mutation de
   * l'original. Aucun cycle d'approbation propre : l'action elle-même, réservée à ORG_ADMIN/DAF
   * (cf. @Roles sur le contrôleur) avec motif obligatoire, en tient lieu.
   */
  async extourner(id: string, dto: MotifDto, userId: string) {
    const depense = await this.obtenirBrute(id);
    this.exigerStatut(depense, StatutOperationnel.ENREGISTRE, 'STATUT_INVALIDE_POUR_EXTOURNE', 'extournée');

    const dejaExtournee = await this.tenantPrisma.db.expense.findFirst({ where: { extourne_de_id: id } });
    if (dejaExtournee) {
      throw new ConflictException({
        code: 'DEJA_EXTOURNE',
        message: 'Cette dépense a déjà été extournée.',
      });
    }

    return this.tenantPrisma.db.expense.create({
      data: {
        organization_id: this.tenantPrisma.organizationId,
        date_depense: new Date(),
        montant_ht: depense.montant_ht.negated(),
        categorie_id: depense.categorie_id,
        project_id: depense.project_id,
        fournisseur: depense.fournisseur,
        reference_piece: depense.reference_piece,
        statut: StatutOperationnel.EXTOURNE,
        extourne_de_id: depense.id,
        motif_extourne: dto.motif,
        created_by: userId,
        updated_by: userId,
      },
      include: INCLUSION_STANDARD,
    });
  }

  private async obtenirBrute(id: string) {
    const depense = await this.tenantPrisma.db.expense.findUnique({ where: { id } });
    if (!depense) {
      throw new NotFoundException({ code: 'RESSOURCE_INTROUVABLE', message: 'Dépense introuvable.' });
    }
    return depense;
  }

  private exigerStatut(
    depense: { statut: StatutOperationnel },
    attendu: StatutOperationnel,
    code: string,
    action: string,
  ): void {
    if (depense.statut !== attendu) {
      throw new BadRequestException({
        code,
        message: `Seule une dépense au statut "${attendu}" peut être ${action} (statut actuel : "${depense.statut}").`,
      });
    }
  }
}
