import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { RoleUtilisateur } from '@batione/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { ProjectsService } from './projects.service';

const ROLES_GESTION_PROJET = [RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.GESTIONNAIRE, RoleUtilisateur.CONDUCTEUR_TRAVAUX];

@Controller('projets')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  lister(@Query() query: ListProjectsQueryDto) {
    return this.projectsService.lister(query);
  }

  @Get(':id')
  obtenir(@Param('id') id: string) {
    return this.projectsService.obtenir(id);
  }

  @Post()
  @Roles(...ROLES_GESTION_PROJET)
  creer(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.creer(dto, user.userId);
  }

  @Patch(':id')
  @Roles(...ROLES_GESTION_PROJET)
  mettreAJour(@Param('id') id: string, @Body() dto: UpdateProjectDto, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.mettreAJour(id, dto, user.userId);
  }

  @Delete(':id')
  @Roles(RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.GESTIONNAIRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async archiver(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.projectsService.archiver(id, user.userId);
  }
}
