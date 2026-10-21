import { IsString, MinLength } from 'class-validator';

export class CreateExpenseCategoryDto {
  @IsString()
  @MinLength(2, { message: 'Le nom de la catégorie doit contenir au moins 2 caractères.' })
  nom!: string;
}
