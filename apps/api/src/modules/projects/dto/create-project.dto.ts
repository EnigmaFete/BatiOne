import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';
import { TypeProjet } from '@batione/shared-types';

export class CreateProjectDto {
  @IsString()
  @MinLength(2, { message: 'Le nom du projet doit contenir au moins 2 caractères.' })
  nom!: string;

  @IsEnum(TypeProjet, { message: 'Type de projet invalide.' })
  type!: TypeProjet;

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
  @IsString()
  description?: string;
}
