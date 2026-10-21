import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { RoleUtilisateur } from '@batione/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { ListEquipmentQueryDto } from './dto/list-equipment-query.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { EquipmentService } from './equipment.service';

const ROLES_GESTION_MATERIEL = [RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.GESTIONNAIRE, RoleUtilisateur.GESTIONNAIRE_MATERIEL];

@Controller('equipement')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  lister(@Query() query: ListEquipmentQueryDto) {
    return this.equipmentService.lister(query);
  }

  @Get(':id')
  obtenir(@Param('id') id: string) {
    return this.equipmentService.obtenir(id);
  }

  @Post()
  @Roles(...ROLES_GESTION_MATERIEL)
  creer(@Body() dto: CreateEquipmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.equipmentService.creer(dto, user.userId);
  }

  @Patch(':id')
  @Roles(...ROLES_GESTION_MATERIEL)
  mettreAJour(@Param('id') id: string, @Body() dto: UpdateEquipmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.equipmentService.mettreAJour(id, dto, user.userId);
  }

  @Delete(':id')
  @Roles(RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.GESTIONNAIRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async archiver(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.equipmentService.archiver(id, user.userId);
  }

  @Post(':id/affectations')
  @Roles(...ROLES_GESTION_MATERIEL)
  affecter(@Param('id') id: string, @Body() dto: CreateAssignmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.equipmentService.affecter(id, dto, user.userId);
  }

  @Post(':id/affectations/:assignmentId/retour')
  @Roles(...ROLES_GESTION_MATERIEL)
  retourner(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.equipmentService.retourner(id, assignmentId, user.userId);
  }
}
