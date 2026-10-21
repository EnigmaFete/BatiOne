/**
 * Convertit une chaîne de date simple ("YYYY-MM-DD", issue de `@IsDateString()`) en `Date` pour
 * un champ Prisma `@db.Date`. Nécessaire : Prisma/le driver PostgreSQL rejette une chaîne
 * date-only brute pour un scalar `DateTime` avec "Invalid value ... premature end of input.
 * Expected ISO-8601 DateTime" — il faut un objet `Date` (ou un ISO complet avec heure), jamais
 * une chaîne date-only transmise telle quelle. Bug réel rencontré et corrigé sur Expense/Project.
 */
export function toDateOrUndefined(valeur: string | undefined): Date | undefined {
  return valeur === undefined ? undefined : new Date(valeur);
}
