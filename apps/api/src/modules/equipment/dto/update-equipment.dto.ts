import { IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { StatutEquipement } from '@batione/shared-types';

export class UpdateEquipmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nom?: string;

  @IsOptional()
  @IsString()
  categorie?: string;

  @IsOptional()
  @IsEnum(StatutEquipement, { message: 'Statut invalide.' })
  statut?: StatutEquipement;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Le coût horaire ne peut pas être négatif.' })
  coutHoraireInterne?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
