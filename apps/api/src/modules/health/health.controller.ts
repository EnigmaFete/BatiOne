import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  verifier() {
    return {
      statut: 'ok',
      horodatage: new Date().toISOString(),
      fuseau_horaire: 'Africa/Casablanca',
    };
  }
}
