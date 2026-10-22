import { Controller, Get, Query } from '@nestjs/common';
import { RoleUtilisateur } from '@batione/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReportsService, SyntheseRapport } from './reports.service';

@Controller('rapports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('synthese')
  @Roles(
    RoleUtilisateur.ORG_ADMIN,
    RoleUtilisateur.GESTIONNAIRE,
    RoleUtilisateur.DAF_COMPTABLE,
    RoleUtilisateur.CONDUCTEUR_TRAVAUX,
    RoleUtilisateur.CHEF_CHANTIER,
    RoleUtilisateur.RH_PAIE
  )
  getSynthese(
    @Query('periode') periode?: string,
    @Query('project_id') projectId?: string
  ): Promise<SyntheseRapport> {
    return this.reportsService.getSynthese({
      periode,
      project_id: projectId,
    });
  }
}
