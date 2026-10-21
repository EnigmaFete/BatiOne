import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { TypeMouvementStock } from '@batione/shared-types';

export class CreateStockMovementDto {
  @IsEnum(TypeMouvementStock, { message: 'Type de mouvement invalide.' })
  type!: TypeMouvementStock;

  @IsUUID()
  articleId!: string;

  /**
   * Pour ENTREE/SORTIE : quantité déplacée (toujours positive). Pour AJUSTEMENT : nouvelle
   * quantité disponible ABSOLUE (pas un delta) — le service calcule la différence en interne,
   * ce qui est plus clair pour l'utilisateur qu'un delta signé ("je compte 48 sacs en stock" est
   * plus naturel à saisir qu'un écart calculé).
   */
  @IsNumber()
  @Min(0, { message: 'La quantité ne peut pas être négative.' })
  quantite!: number;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  coutUnitaire?: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
