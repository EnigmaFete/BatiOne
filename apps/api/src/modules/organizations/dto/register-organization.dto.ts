import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/** Onboarding d'une nouvelle organisation + son premier utilisateur ORG_ADMIN. */
export class RegisterOrganizationDto {
  @IsString()
  @MinLength(2, { message: 'Le nom de la société doit contenir au moins 2 caractères.' })
  nomSociete!: string;

  @IsString()
  @MinLength(1, { message: "L'ICE est obligatoire." })
  ice!: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsString()
  prenomAdmin!: string;

  @IsString()
  nomAdmin!: string;

  @IsEmail({}, { message: 'Adresse email invalide.' })
  emailAdmin!: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  motDePasseAdmin!: string;
}
