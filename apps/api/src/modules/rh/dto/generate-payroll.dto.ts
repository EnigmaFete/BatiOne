import { IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GeneratePayrollDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  periode_mois!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  periode_annee!: number;
}
