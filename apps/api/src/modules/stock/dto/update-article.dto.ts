import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nom?: string;

  @IsOptional()
  @IsString()
  categorie?: string;

  @IsOptional()
  @IsString()
  unite?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Le prix ne peut pas être négatif.' })
  prixUnitaire?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Le seuil d’alerte ne peut pas être négatif.' })
  seuilAlerte?: number;
}
