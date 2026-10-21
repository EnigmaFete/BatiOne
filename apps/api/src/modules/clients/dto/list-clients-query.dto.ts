import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TypeClient } from '@batione/shared-types';

export class ListClientsQueryDto {
  @IsOptional()
  @IsString()
  recherche?: string;

  @IsOptional()
  @IsEnum(TypeClient, { message: 'Type de client invalide.' })
  type?: TypeClient;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number = 25;
}
