import { ConflictException, Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async lister() {
    return this.tenantPrisma.db.expenseCategory.findMany({ orderBy: { nom: 'asc' } });
  }

  async creer(dto: CreateExpenseCategoryDto) {
    const existante = await this.tenantPrisma.db.expenseCategory.findFirst({ where: { nom: dto.nom } });
    if (existante) {
      throw new ConflictException({
        code: 'CATEGORIE_DEJA_EXISTANTE',
        message: 'Une catégorie de dépense avec ce nom existe déjà.',
      });
    }
    return this.tenantPrisma.db.expenseCategory.create({
      data: { organization_id: this.tenantPrisma.organizationId, nom: dto.nom },
    });
  }
}
