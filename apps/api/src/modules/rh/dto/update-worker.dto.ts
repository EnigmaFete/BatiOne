import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { StatutWorker, TypeContratWorker } from '@batione/database';

export class UpdateWorkerDto {
  @IsOptional()
  @IsString()
  matricule?: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsString()
  cin?: string;

  @IsOptional()
  @IsString()
  cnss_num?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  poste?: string;

  @IsOptional()
  @IsString()
  departement?: string;

  @IsOptional()
  @IsEnum(TypeContratWorker)
  type_contrat?: TypeContratWorker;

  @IsOptional()
  @IsEnum(StatutWorker)
  statut?: StatutWorker;

  @IsOptional()
  @IsString()
  date_embauche?: string;

  @IsOptional()
  @IsString()
  date_fin_contrat?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaire_base_mad?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taux_journalier_mad?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taux_horaire_mad?: number;

  @IsOptional()
  @IsString()
  banque?: string;

  @IsOptional()
  @IsString()
  rib?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  nombre_deductions_ir?: number;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  contact_urgence_nom?: string;

  @IsOptional()
  @IsString()
  contact_urgence_tel?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
