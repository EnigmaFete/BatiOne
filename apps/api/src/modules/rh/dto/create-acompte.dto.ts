import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ModePaiement } from '@batione/database';

export class CreateAcompteDto {
  @IsNotEmpty({ message: 'Le collaborateur est obligatoire' })
  @IsString()
  worker_id!: string;

  @IsOptional()
  @IsString()
  project_id?: string;

  @IsNotEmpty({ message: 'La date est obligatoire' })
  @IsString()
  date_acompte!: string;

  @IsNumber({}, { message: 'Le montant doit être un nombre' })
  @IsPositive({ message: 'Le montant de l’acompte doit être supérieur à zéro' })
  montant_mad!: number;

  @IsOptional()
  @IsEnum(ModePaiement)
  mode_paiement?: ModePaiement = ModePaiement.ESPECES;

  @IsOptional()
  @IsString()
  motif?: string;
}
