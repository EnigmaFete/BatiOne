import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { RoleUtilisateur } from '@batione/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { PayrollService } from './payroll.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { ExtournePayslipDto } from './dto/extourne-payslip.dto';

@Controller('paie')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('bulletins')
  lister(
    @Query('annee') annee?: string,
    @Query('mois') mois?: string
  ) {
    const maintenant = new Date();
    const anneeCible = annee ? parseInt(annee, 10) : maintenant.getFullYear();
    const moisCible = mois ? parseInt(mois, 10) : maintenant.getMonth() + 1;
    return this.payrollService.lister(anneeCible, moisCible);
  }

  @Get('bulletins/:id')
  obtenir(@Param('id') id: string) {
    return this.payrollService.obtenir(id);
  }

  @Post('generer')
  @Roles(
    RoleUtilisateur.ORG_ADMIN,
    RoleUtilisateur.DAF_COMPTABLE,
    RoleUtilisateur.RH_PAIE
  )
  generer(@Body() dto: GeneratePayrollDto) {
    return this.payrollService.genererMois(dto);
  }

  @Post('bulletins/:id/soumettre')
  @Roles(
    RoleUtilisateur.ORG_ADMIN,
    RoleUtilisateur.DAF_COMPTABLE,
    RoleUtilisateur.RH_PAIE
  )
  soumettre(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.payrollService.soumettre(id, user.userId);
  }

  @Post('bulletins/:id/approuver')
  @Roles(RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.DAF_COMPTABLE)
  approuver(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.payrollService.approuver(id, user.userId);
  }

  @Post('bulletins/:id/rejeter')
  @Roles(RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.DAF_COMPTABLE)
  rejeter(
    @Param('id') id: string,
    @Body('motif') motif: string
  ) {
    return this.payrollService.rejeter(id, motif || 'Rejet sans motif spécifié');
  }

  @Post('bulletins/:id/enregistrer')
  @Roles(RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.DAF_COMPTABLE)
  enregistrer(@Param('id') id: string) {
    return this.payrollService.enregistrer(id);
  }

  @Post('bulletins/:id/extourner')
  @Roles(RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.DAF_COMPTABLE)
  extourner(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ExtournePayslipDto
  ) {
    return this.payrollService.extourner(id, user.userId, dto);
  }
}
