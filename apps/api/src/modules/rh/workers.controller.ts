import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RoleUtilisateur } from '@batione/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { WorkersService } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { FilterWorkersDto } from './dto/filter-workers.dto';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  lister(@Query() query: FilterWorkersDto) {
    return this.workersService.lister(query);
  }

  @Get('selection')
  listerPourSelection() {
    return this.workersService.listerPourSelection();
  }

  @Get(':id')
  obtenir(@Param('id') id: string) {
    return this.workersService.obtenir(id);
  }

  @Post()
  @Roles(
    RoleUtilisateur.ORG_ADMIN,
    RoleUtilisateur.GESTIONNAIRE,
    RoleUtilisateur.RH_PAIE,
    RoleUtilisateur.CONDUCTEUR_TRAVAUX
  )
  creer(@Body() dto: CreateWorkerDto) {
    return this.workersService.creer(dto);
  }

  @Patch(':id')
  @Roles(
    RoleUtilisateur.ORG_ADMIN,
    RoleUtilisateur.GESTIONNAIRE,
    RoleUtilisateur.RH_PAIE
  )
  modifier(@Param('id') id: string, @Body() dto: UpdateWorkerDto) {
    return this.workersService.modifier(id, dto);
  }

  @Delete(':id')
  @Roles(RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.RH_PAIE)
  archiver(@Param('id') id: string) {
    return this.workersService.archiver(id);
  }
}
