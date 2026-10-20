import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RoleUtilisateur } from '@batione/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('utilisateurs')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(RoleUtilisateur.ORG_ADMIN)
  lister() {
    return this.usersService.lister();
  }

  @Post()
  @Roles(RoleUtilisateur.ORG_ADMIN)
  creer(@Body() dto: CreateUserDto) {
    return this.usersService.creer(dto);
  }

  @Patch(':id')
  @Roles(RoleUtilisateur.ORG_ADMIN)
  mettreAJour(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.mettreAJour(id, dto);
  }
}
