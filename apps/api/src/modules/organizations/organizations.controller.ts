import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { RoleUtilisateur } from '@batione/database';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@Controller()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Public()
  @Post('organisations/inscription')
  @HttpCode(HttpStatus.CREATED)
  inscription(@Body() dto: RegisterOrganizationDto) {
    return this.organizationsService.inscrire(dto);
  }

  @Get('organisation/profil')
  @Roles(RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.DAF_COMPTABLE)
  profil(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationsService.obtenirProfil(user.organizationId);
  }

  @Patch('organisation/profil')
  @Roles(RoleUtilisateur.ORG_ADMIN)
  mettreAJourProfil(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.mettreAJourProfil(user.organizationId, dto);
  }
}
