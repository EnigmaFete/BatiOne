import { Body, Controller, Get, Post } from '@nestjs/common';
import { RoleUtilisateur } from '@batione/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { ExpenseCategoriesService } from './expense-categories.service';

@Controller('categories-depenses')
export class ExpenseCategoriesController {
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) {}

  @Get()
  lister() {
    return this.expenseCategoriesService.lister();
  }

  @Post()
  @Roles(RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.GESTIONNAIRE, RoleUtilisateur.DAF_COMPTABLE)
  creer(@Body() dto: CreateExpenseCategoryDto) {
    return this.expenseCategoriesService.creer(dto);
  }
}
