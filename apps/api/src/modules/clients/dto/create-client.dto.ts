import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ConditionsPaiement, TypeClient } from '@batione/shared-types';

export class CreateClientDto {
  @IsString()
  @MinLength(2, { message: 'Le nom du client doit contenir au moins 2 caractères.' })
  nom!: string;

  @IsOptional()
  @IsEnum(TypeClient, { message: 'Type de client invalide.' })
  type?: TypeClient;

  @IsOptional()
  @IsString()
  personneContact?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  ice?: string;

  @IsOptional()
  @IsString()
  ifNum?: string;

  @IsOptional()
  @IsString()
  rc?: string;

  @IsOptional()
  @IsString()
  cnss?: string;

  @IsOptional()
  @IsEnum(ConditionsPaiement, { message: 'Conditions de paiement invalides.' })
  conditionsPaiement?: ConditionsPaiement;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'La limite de crédit ne peut pas être négative.' })
  limiteCredit?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
