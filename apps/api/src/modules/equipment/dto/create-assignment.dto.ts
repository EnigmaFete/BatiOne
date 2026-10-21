import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAssignmentDto {
  @IsUUID()
  projectId!: string;

  @IsDateString()
  dateDebut!: string;

  @IsOptional()
  @IsDateString()
  dateRetourPrevu?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
