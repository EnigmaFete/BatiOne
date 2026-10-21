import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ExtournePayslipDto {
  @IsNotEmpty({ message: 'Le motif d’extourne est obligatoire' })
  @IsString()
  @MinLength(5, { message: 'Le motif d’extourne doit comporter au moins 5 caractères' })
  motif_extourne!: string;
}
