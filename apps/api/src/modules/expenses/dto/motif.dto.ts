import { IsString, MinLength } from 'class-validator';

/** Payload commun aux actions exigeant un motif obligatoire (rejet, extourne — API_CONTRACTS.md §2). */
export class MotifDto {
  @IsString()
  @MinLength(5, { message: 'Le motif doit contenir au moins 5 caractères.' })
  motif!: string;
}
