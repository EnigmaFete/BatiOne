import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { RoleUtilisateur } from '@batione/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { AcomptesService } from './acomptes.service';
import { CreateAcompteDto } from './dto/create-acompte.dto';

@Controller('acomptes')
export class AcomptesController {
  constructor(private readonly acomptesService: AcomptesService) {}

  @Get()
  lister(
    @Query('worker_id') workerId?: string,
    @Query('non_deduits') nonDeduits?: string
  ) {
    return this.acomptesService.lister({
      worker_id: workerId,
      non_deduits: nonDeduits === 'true',
    });
  }

  @Post()
  @Roles(
    RoleUtilisateur.ORG_ADMIN,
    RoleUtilisateur.GESTIONNAIRE,
    RoleUtilisateur.CHEF_CHANTIER,
    RoleUtilisateur.CONDUCTEUR_TRAVAUX,
    RoleUtilisateur.DAF_COMPTABLE,
    RoleUtilisateur.RH_PAIE
  )
  creer(@Body() dto: CreateAcompteDto) {
    return this.acomptesService.creer(dto);
  }

  @Delete(':id')
  @Roles(
    RoleUtilisateur.ORG_ADMIN,
    RoleUtilisateur.DAF_COMPTABLE,
    RoleUtilisateur.RH_PAIE
  )
  supprimer(@Param('id') id: string) {
    return this.acomptesService.supprimer(id);
  }
}
