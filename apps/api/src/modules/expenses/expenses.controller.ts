import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { RoleUtilisateur } from '@batione/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ListExpensesQueryDto } from './dto/list-expenses-query.dto';
import { MotifDto } from './dto/motif.dto';
import { ExpensesService } from './expenses.service';

const ROLES_SAISIE = [
  RoleUtilisateur.ORG_ADMIN,
  RoleUtilisateur.GESTIONNAIRE,
  RoleUtilisateur.CONDUCTEUR_TRAVAUX,
  RoleUtilisateur.CHEF_CHANTIER,
  RoleUtilisateur.DAF_COMPTABLE,
];
const ROLES_VALIDATION = [RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.DAF_COMPTABLE, RoleUtilisateur.CONDUCTEUR_TRAVAUX];
const ROLES_SCELLEMENT = [RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.DAF_COMPTABLE];

@Controller('depenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  lister(@Query() query: ListExpensesQueryDto) {
    return this.expensesService.lister(query);
  }

  @Get(':id')
  obtenir(@Param('id') id: string) {
    return this.expensesService.obtenir(id);
  }

  @Post()
  @Roles(...ROLES_SAISIE)
  creer(
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.expensesService.creer(dto, user.userId, idempotencyKey);
  }

  @Patch(':id')
  @Roles(...ROLES_SAISIE)
  mettreAJour(@Param('id') id: string, @Body() dto: UpdateExpenseDto, @CurrentUser() user: AuthenticatedUser) {
    return this.expensesService.mettreAJour(id, dto, user.userId);
  }

  @Post(':id/soumettre')
  @Roles(...ROLES_SAISIE)
  soumettre(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.expensesService.soumettre(id, user.userId);
  }

  @Post(':id/approuver')
  @Roles(...ROLES_VALIDATION)
  approuver(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.expensesService.approuver(id, user.userId);
  }

  @Post(':id/rejeter')
  @Roles(...ROLES_VALIDATION)
  rejeter(@Param('id') id: string, @Body() dto: MotifDto, @CurrentUser() user: AuthenticatedUser) {
    return this.expensesService.rejeter(id, dto, user.userId);
  }

  @Post(':id/enregistrer')
  @Roles(...ROLES_SCELLEMENT)
  enregistrer(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.expensesService.enregistrer(id, user.userId);
  }

  @Post(':id/extourner')
  @Roles(...ROLES_SCELLEMENT)
  extourner(@Param('id') id: string, @Body() dto: MotifDto, @CurrentUser() user: AuthenticatedUser) {
    return this.expensesService.extourner(id, dto, user.userId);
  }
}
