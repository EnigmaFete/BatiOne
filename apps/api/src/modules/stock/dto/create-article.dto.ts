import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @MinLength(2, { message: 'Le nom de l’article doit contenir au moins 2 caractères.' })
  nom!: string;

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
