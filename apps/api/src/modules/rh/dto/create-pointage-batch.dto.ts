import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatutPresence } from '@batione/database';

export class LignePointageDto {
  @IsNotEmpty()
  @IsString()
  worker_id!: string;

  @IsEnum(StatutPresence)
  statut_presence!: StatutPresence;

  @IsOptional()
  @IsNumber()
  @Min(0)
  heures_normales?: number = 8;

  @IsOptional()
  @IsNumber()
  @Min(0)
  heures_sup?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cout_journee_mad?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePointageBatchDto {
  @IsNotEmpty({ message: 'La date de pointage est obligatoire' })
  @IsString()
  date_pointage!: string;

  @IsOptional()
  @IsString()
  project_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LignePointageDto)
  lignes!: LignePointageDto[];
}
