import { IsOptional, IsString } from 'class-validator';

/** Mise à jour du profil société (ICE/RC/Patente non modifiables ici — nécessitent un contrôle dédié). */
export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  rc?: string;

  @IsOptional()
  @IsString()
  if_num?: string;

  @IsOptional()
  @IsString()
  patente?: string;

  @IsOptional()
  @IsString()
  cnss_employeur?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  rib?: string;

  @IsOptional()
  @IsString()
  banque?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;
}
