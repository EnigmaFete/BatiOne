import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@batione/database';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async lister(query: ListClientsQueryDto) {
    const page = query.page ?? 1;
    const limite = query.limite ?? 25;

    const where: Prisma.ClientWhereInput = {
      deleted_at: null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.recherche
        ? {
            OR: [
              { nom: { contains: query.recherche, mode: 'insensitive' } },
              { email: { contains: query.recherche, mode: 'insensitive' } },
              { telephone: { contains: query.recherche, mode: 'insensitive' } },
              { ice: { contains: query.recherche, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [clients, total] = await Promise.all([
      this.tenantPrisma.db.client.findMany({
        where,
        orderBy: { nom: 'asc' },
        skip: (page - 1) * limite,
        take: limite,
      }),
      this.tenantPrisma.db.client.count({ where }),
    ]);

    return {
      donnees: clients,
      metadonnees: { page, limite, total, total_pages: Math.max(1, Math.ceil(total / limite)) },
    };
  }

  /** Liste légère (id + nom) pour peupler un sélecteur — sans pagination, triée alphabétiquement. */
  async listerPourSelection() {
    return this.tenantPrisma.db.client.findMany({
      where: { deleted_at: null },
      select: { id: true, nom: true, type: true },
      orderBy: { nom: 'asc' },
    });
  }

  async obtenir(id: string) {
    const client = await this.tenantPrisma.db.client.findFirst({
      where: { id, deleted_at: null },
      include: { projects: { where: { deleted_at: null }, select: { id: true, code: true, nom: true, statut: true } } },
    });
    if (!client) {
      throw new NotFoundException({ code: 'RESSOURCE_INTROUVABLE', message: 'Client introuvable.' });
    }
    return client;
  }

  async creer(dto: CreateClientDto, userId: string) {
    if (dto.ice) {
      const existant = await this.tenantPrisma.db.client.findFirst({
        where: { ice: dto.ice, deleted_at: null },
      });
      if (existant) {
        throw new ConflictException({
          code: 'ICE_DEJA_UTILISE',
          message: 'Un client avec cet ICE existe déjà.',
        });
      }
    }

    return this.tenantPrisma.db.client.create({
      data: {
        organization_id: this.tenantPrisma.organizationId,
        nom: dto.nom,
        type: dto.type,
        personne_contact: dto.personneContact,
        telephone: dto.telephone,
        whatsapp: dto.whatsapp,
        email: dto.email,
        adresse: dto.adresse,
        ville: dto.ville,
        region: dto.region,
        ice: dto.ice,
        if_num: dto.ifNum,
        rc: dto.rc,
        cnss: dto.cnss,
        conditions_paiement: dto.conditionsPaiement,
        limite_credit: dto.limiteCredit ?? 0,
        notes: dto.notes,
        created_by: userId,
        updated_by: userId,
      },
    });
  }

  async mettreAJour(id: string, dto: UpdateClientDto, userId: string) {
    await this.obtenir(id);
    return this.tenantPrisma.db.client.update({
      where: { id },
      data: {
        nom: dto.nom,
        type: dto.type,
        personne_contact: dto.personneContact,
        telephone: dto.telephone,
        whatsapp: dto.whatsapp,
        email: dto.email,
        adresse: dto.adresse,
        ville: dto.ville,
        region: dto.region,
        ice: dto.ice,
        if_num: dto.ifNum,
        rc: dto.rc,
        cnss: dto.cnss,
        conditions_paiement: dto.conditionsPaiement,
        limite_credit: dto.limiteCredit,
        notes: dto.notes,
        updated_by: userId,
      },
    });
  }

  async archiver(id: string, userId: string) {
    await this.obtenir(id);
    await this.tenantPrisma.db.client.update({
      where: { id },
      data: { deleted_at: new Date(), updated_by: userId },
    });
  }
}
