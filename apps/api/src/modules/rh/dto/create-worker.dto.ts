import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TypeContratWorker } from '@batione/database';

export class CreateWorkerDto {
  @IsOptional()
  @IsString()
  matricule?: string;

  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @IsString()
  nom!: string;

  @IsNotEmpty({ message: 'Le prénom est obligatoire' })
  @IsString()
  prenom!: string;

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

  @IsNotEmpty({ message: 'Le poste ou métier est obligatoire' })
  @IsString()
  poste!: string;

  @IsOptional()
  @IsString()
  departement?: string;

  @IsOptional()
  @IsEnum(TypeContratWorker, { message: 'Type de contrat invalide' })
  type_contrat?: TypeContratWorker;

  @IsOptional()
  @IsString()
  date_embauche?: string;

  @IsOptional()
  @IsString()
  date_fin_contrat?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Le salaire de base doit être un nombre' })
  @Min(0)
  salaire_base_mad?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Le taux journalier doit être un nombre' })
  @Min(0)
  taux_journalier_mad?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Le taux horaire doit être un nombre' })
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
  @Max(6, { message: 'Le nombre de déductions pour charge de famille ne peut dépasser 6' })
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
