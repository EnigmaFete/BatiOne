import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  async lister() {
    const users = await this.tenantPrisma.db.user.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'asc' },
    });
    return users.map(this.toPublic);
  }

  async creer(dto: CreateUserDto) {
    // L'unicité d'email est globale (colonne @unique) — vérification explicite via le client
    // global pour renvoyer une erreur métier claire plutôt qu'une violation de contrainte brute.
    const existant = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existant) {
      throw new ConflictException({
        code: 'EMAIL_DEJA_UTILISE',
        message: 'Un compte existe déjà avec cette adresse email.',
      });
    }

    const password_hash = await argon2.hash(dto.motDePasse);
    const user = await this.tenantPrisma.db.user.create({
      data: {
        // Fixé explicitement (en plus de l'injection automatique de l'extension tenant) car le
        // type Prisma généré exige organization_id statiquement — l'extension ne change que le
        // comportement runtime, cf. TenantPrismaService.organizationId.
        organization_id: this.tenantPrisma.organizationId,
        nom: dto.nom,
        prenom: dto.prenom,
        email: dto.email,
        password_hash,
        role: dto.role,
      },
    });
    return this.toPublic(user);
  }

  async mettreAJour(id: string, dto: UpdateUserDto) {
    const existant = await this.tenantPrisma.db.user.findUnique({ where: { id } });
    if (!existant) {
      throw new NotFoundException({ code: 'RESSOURCE_INTROUVABLE', message: 'Utilisateur introuvable.' });
    }
    const user = await this.tenantPrisma.db.user.update({ where: { id }, data: dto });
    return this.toPublic(user);
  }

  private toPublic(user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    actif: boolean;
    created_at: Date;
  }) {
    return {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      actif: user.actif,
      created_at: user.created_at,
    };
  }
}
