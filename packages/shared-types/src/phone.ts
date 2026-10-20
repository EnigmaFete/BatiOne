/**
 * Validation du format téléphonique marocain international.
 * Mobile : +212 6XX XXX XXX ou +212 7XX XXX XXX. Fixe : +212 5XX XXX XXX.
 */
const MOROCCAN_PHONE_REGEX = /^\+212[\s]?[5-7][\s]?\d{2}[\s]?\d{3}[\s]?\d{3}$/;

export function isValidMoroccanPhone(phone: string): boolean {
  return MOROCCAN_PHONE_REGEX.test(phone.trim());
}

/** Normalise un numéro marocain vers le format d'affichage `+212 6XX XXX XXX`. */
export function formatMoroccanPhone(phone: string): string {
  const digitsOnly = phone.trim().replace(/[\s.-]/g, '');
  const withoutPrefix = digitsOnly.startsWith('+212')
    ? digitsOnly.slice(4)
    : digitsOnly.startsWith('00212')
      ? digitsOnly.slice(5)
      : digitsOnly.startsWith('0')
        ? digitsOnly.slice(1)
        : digitsOnly;

  if (!/^[5-7]\d{8}$/.test(withoutPrefix)) {
    throw new RangeError(`formatMoroccanPhone: numéro invalide reçu (${phone})`);
  }

  return `+212 ${withoutPrefix.slice(0, 3)} ${withoutPrefix.slice(3, 6)} ${withoutPrefix.slice(6, 9)}`;
}
