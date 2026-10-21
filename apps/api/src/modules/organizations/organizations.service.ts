import { ConflictException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { RoleUtilisateur } from '@batione/database';
import { CATEGORIES_DEPENSE_PAR_DEFAUT } from '@batione/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  /**
   * Onboarding : crée l'organisation et son premier utilisateur `ORG_ADMIN` dans une transaction
   * unique — soit les deux existent, soit aucun (jamais une organisation sans administrateur).
   */
  async inscrire(dto: RegisterOrganizationDto) {
    const emailExistant = await this.prisma.user.findUnique({ where: { email: dto.emailAdmin } });
    if (emailExistant) {
      throw new ConflictException({
        code: 'EMAIL_DEJA_UTILISE',
        message: 'Un compte existe déjà avec cette adresse email.',
      });
    }

    const iceExistant = await this.prisma.organization.findUnique({ where: { ice: dto.ice } });
    if (iceExistant) {
      throw new ConflictException({
        code: 'ICE_DEJA_UTILISE',
        message: 'Une organisation est déjà enregistrée avec cet ICE.',
      });
    }

    const passwordHash = await argon2.hash(dto.motDePasseAdmin);

    const { organization, user } = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          nom: dto.nomSociete,
          ice: dto.ice,
          ville: dto.ville ?? 'Casablanca',
        },
      });

      const user = await tx.user.create({
        data: {
          organization_id: organization.id,
          nom: dto.nomAdmin,
          prenom: dto.prenomAdmin,
          email: dto.emailAdmin,
          password_hash: passwordHash,
          role: RoleUtilisateur.ORG_ADMIN,
        },
      });

      // Catégories de dépenses par défaut (PRODUCT_SPEC.md §6) — personnalisables ensuite,
      // jamais figées, mais une entreprise ne doit pas démarrer avec une liste vide.
      await tx.expenseCategory.createMany({
        data: CATEGORIES_DEPENSE_PAR_DEFAUT.map((nom) => ({ organization_id: organization.id, nom })),
      });

      return { organization, user };
    });

    return {
      organization: { id: organization.id, nom: organization.nom, ice: organization.ice },
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async obtenirProfil(organizationId: string) {
    return this.tenantPrisma.db.organization.findUniqueOrThrow({ where: { id: organizationId } });
  }

  async mettreAJourProfil(organizationId: string, dto: UpdateOrganizationDto) {
    return this.tenantPrisma.db.organization.update({ where: { id: organizationId }, data: dto });
  }
}
