import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { StatutOperationnel } from '@batione/shared-types';

export class ListExpensesQueryDto {
  @IsOptional()
  @IsString()
  recherche?: string;

  @IsOptional()
  @IsEnum(StatutOperationnel, { message: 'Statut invalide.' })
  statut?: StatutOperationnel;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  categorieId?: string;

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
