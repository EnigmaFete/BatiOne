import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { RoleUtilisateur } from '@batione/database';

export class CreateUserDto {
  @IsString()
  nom!: string;

  @IsString()
  prenom!: string;

  @IsEmail({}, { message: 'Adresse email invalide.' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  motDePasse!: string;

  @IsEnum(RoleUtilisateur, { message: 'Rôle invalide.' })
  role!: RoleUtilisateur;
}
