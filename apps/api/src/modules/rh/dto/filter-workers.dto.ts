import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutWorker, TypeContratWorker } from '@batione/database';

export class FilterWorkersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limite?: number = 50;

  @IsOptional()
  @IsString()
  recherche?: string;

  @IsOptional()
  @IsEnum(StatutWorker)
  statut?: StatutWorker;

  @IsOptional()
  @IsEnum(TypeContratWorker)
  type_contrat?: TypeContratWorker;

  @IsOptional()
  @IsString()
  poste?: string;
}
