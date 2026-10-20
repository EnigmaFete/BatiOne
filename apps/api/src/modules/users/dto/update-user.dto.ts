import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { RoleUtilisateur } from '@batione/database';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(RoleUtilisateur, { message: 'Rôle invalide.' })
  role?: RoleUtilisateur;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
