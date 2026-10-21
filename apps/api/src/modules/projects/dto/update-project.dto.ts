import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';
import { StatutProjet, TypeProjet } from '@batione/shared-types';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nom?: string;

  @IsOptional()
  @IsEnum(TypeProjet, { message: 'Type de projet invalide.' })
  type?: TypeProjet;

  @IsOptional()
  @IsEnum(StatutProjet, { message: 'Statut de projet invalide.' })
  statut?: StatutProjet;

  @IsOptional()
  @IsString()
  clientNom?: string;

  @IsOptional()
  @IsUUID()
  responsableId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Le budget ne peut pas être négatif.' })
  budget?: number;

  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @IsOptional()
  @IsDateString()
  dateFinPrevue?: string;

  @IsOptional()
  @IsDateString()
  dateFinReelle?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
