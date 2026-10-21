import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  @MinLength(2, { message: 'Le nom de l’équipement doit contenir au moins 2 caractères.' })
  nom!: string;

  @IsOptional()
  @IsString()
  categorie?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Le coût horaire ne peut pas être négatif.' })
  coutHoraireInterne?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
