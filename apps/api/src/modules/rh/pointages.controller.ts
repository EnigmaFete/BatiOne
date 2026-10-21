import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RoleUtilisateur } from '@batione/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { PointagesService } from './pointages.service';
import { CreatePointageBatchDto } from './dto/create-pointage-batch.dto';

@Controller('pointages')
export class PointagesController {
  constructor(private readonly pointagesService: PointagesService) {}

  @Get('date')
  obtenirParDate(
    @Query('date') date: string,
    @Query('project_id') projectId?: string
  ) {
    const dateCible = date || new Date().toISOString().split('T')[0];
    return this.pointagesService.obtenirParDate(dateCible, projectId);
  }

  @Post('batch')
  @Roles(
    RoleUtilisateur.ORG_ADMIN,
    RoleUtilisateur.GESTIONNAIRE,
    RoleUtilisateur.CHEF_CHANTIER,
    RoleUtilisateur.CONDUCTEUR_TRAVAUX,
    RoleUtilisateur.RH_PAIE
  )
  enregistrerBatch(@Body() dto: CreatePointageBatchDto) {
    return this.pointagesService.enregistrerBatch(dto);
  }
}
