import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { RoleUtilisateur } from '@batione/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { ClientsService } from './clients.service';

const ROLES_GESTION_CLIENT = [
  RoleUtilisateur.ORG_ADMIN,
  RoleUtilisateur.GESTIONNAIRE,
  RoleUtilisateur.DAF_COMPTABLE,
  RoleUtilisateur.CONDUCTEUR_TRAVAUX,
];

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  lister(@Query() query: ListClientsQueryDto) {
    return this.clientsService.lister(query);
  }

  // Déclaré avant ':id' — sinon Nest matcherait 'selection' comme un identifiant de client.
  @Get('selection')
  listerPourSelection() {
    return this.clientsService.listerPourSelection();
  }

  @Get(':id')
  obtenir(@Param('id') id: string) {
    return this.clientsService.obtenir(id);
  }

  @Post()
  @Roles(...ROLES_GESTION_CLIENT)
  creer(@Body() dto: CreateClientDto, @CurrentUser() user: AuthenticatedUser) {
    return this.clientsService.creer(dto, user.userId);
  }

  @Patch(':id')
  @Roles(...ROLES_GESTION_CLIENT)
  mettreAJour(@Param('id') id: string, @Body() dto: UpdateClientDto, @CurrentUser() user: AuthenticatedUser) {
    return this.clientsService.mettreAJour(id, dto, user.userId);
  }

  @Delete(':id')
  @Roles(RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.GESTIONNAIRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async archiver(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.clientsService.archiver(id, user.userId);
  }
}
