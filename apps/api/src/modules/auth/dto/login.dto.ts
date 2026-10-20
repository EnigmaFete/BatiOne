import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email!: string;

  /**
   * Volontairement SANS règle de complexité (contrairement à CreateUserDto/RegisterOrganizationDto) :
   * une contrainte de longueur minimale sur le mot de passe de CONNEXION permettrait à un
   * attaquant de contourner le compteur de verrouillage de compte en soumettant des mots de passe
   * volontairement trop courts pour atteindre AuthService (rejetés en 400 par le DTO avant même
   * d'incrémenter `tentatives_echouees`). Seule une longueur minimale de 1 est imposée.
   */
  @IsString()
  @MinLength(1, { message: 'Le mot de passe est obligatoire.' })
  password!: string;
}
