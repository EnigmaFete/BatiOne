import { Module } from '@nestjs/common';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';
import { PointagesController } from './pointages.controller';
import { PointagesService } from './pointages.service';
import { AcomptesController } from './acomptes.controller';
import { AcomptesService } from './acomptes.service';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';

@Module({
  controllers: [
    WorkersController,
    PointagesController,
    AcomptesController,
    PayrollController,
  ],
  providers: [
    WorkersService,
    PointagesService,
    AcomptesService,
    PayrollService,
  ],
  exports: [
    WorkersService,
    PointagesService,
    AcomptesService,
    PayrollService,
  ],
})
export class RhModule {}
