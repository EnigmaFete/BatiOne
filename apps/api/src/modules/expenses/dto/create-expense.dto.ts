import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { ModePaiement } from '@batione/shared-types';

export class CreateExpenseDto {
  @IsDateString()
  dateDepense!: string;

  @IsNumber()
  @IsPositive({ message: 'Le montant doit être strictement positif.' })
  montantHt!: number;

  @IsUUID()
  categorieId!: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  fournisseur?: string;

  @IsOptional()
  @IsEnum(ModePaiement, { message: 'Mode de paiement invalide.' })
  modePaiement?: ModePaiement;

  @IsOptional()
  @IsString()
  referencePiece?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
