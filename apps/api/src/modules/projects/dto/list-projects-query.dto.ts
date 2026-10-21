import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { StatutProjet, TypeProjet } from '@batione/shared-types';

export class ListProjectsQueryDto {
  @IsOptional()
  @IsString()
  recherche?: string;

  @IsOptional()
  @IsEnum(StatutProjet, { message: 'Statut de projet invalide.' })
  statut?: StatutProjet;

  @IsOptional()
  @IsEnum(TypeProjet, { message: 'Type de projet invalide.' })
  type?: TypeProjet;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number = 25;
}
