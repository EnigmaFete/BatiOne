/**
 * Formatage monétaire MAD (Dirham marocain).
 * Montants exclusivement représentés en `Decimal(14,2)` côté base (ADR-007) — jamais de centimes
 * entiers. Ces helpers n'opèrent que sur la représentation d'affichage, jamais sur le calcul.
 */

/**
 * Formate un montant en MAD selon la convention marocaine, ex. `formatMAD(1250)` -> "1 250,00 MAD".
 * Accepte number ou string (ex. valeur issue de Prisma.Decimal.toString()).
 *
 * Implémentation manuelle (sans `Intl.NumberFormat`) : les données CLDR du séparateur de
 * milliers pour `fr-MA` varient selon la version ICU du runtime (observé : "." au lieu de
 * l'espace attendu) — un format financier affiché à l'utilisateur ne doit jamais dépendre d'une
 * donnée de locale non garantie stable entre environnements.
 */
export function formatMAD(amount: number | string): string {
  const numeric = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(numeric)) {
    throw new RangeError(`formatMAD: montant invalide reçu (${String(amount)})`);
  }

  const negatif = numeric < 0;
  const [entierStr, decimaleStr = '00'] = Math.abs(numeric).toFixed(2).split('.');

  const entierGroupe = entierStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return `${negatif ? '-' : ''}${entierGroupe},${decimaleStr} MAD`;
}

/**
 * Formate une date calendaire métier au format marocain JJ/MM/AAAA.
 * À utiliser pour les dates métier (@db.Date), jamais pour un horodatage UTC brut
 * (cf. ARCHITECTURE.md §5 — le fuseau Africa/Casablanca s'applique à l'interprétation,
 * pas à ce formatage d'affichage).
 */
export function formatDateMA(date: Date): string {
  const jj = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const aaaa = date.getUTCFullYear();
  return `${jj}/${mm}/${aaaa}`;
}
