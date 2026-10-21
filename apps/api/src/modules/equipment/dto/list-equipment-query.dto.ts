import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { StatutEquipement } from '@batione/shared-types';

export class ListEquipmentQueryDto {
  @IsOptional()
  @IsString()
  recherche?: string;

  @IsOptional()
  @IsEnum(StatutEquipement, { message: 'Statut invalide.' })
  statut?: StatutEquipement;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limite?: number = 25;
}
