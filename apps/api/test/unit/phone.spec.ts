import { isValidMoroccanPhone, formatMoroccanPhone } from '@batione/shared-types';

describe('isValidMoroccanPhone', () => {
  it('valide un numéro mobile marocain bien formaté', () => {
    expect(isValidMoroccanPhone('+212 661 234 567')).toBe(true);
  });

  it('rejette un numéro sans indicatif pays', () => {
    expect(isValidMoroccanPhone('0661234567')).toBe(false);
  });

  it('rejette un numéro trop court', () => {
    expect(isValidMoroccanPhone('+212 66 123')).toBe(false);
  });
});

describe('formatMoroccanPhone', () => {
  it('normalise un numéro local (0XXXXXXXXX) vers le format international', () => {
    expect(formatMoroccanPhone('0661234567')).toBe('+212 661 234 567');
  });

  it('normalise un numéro déjà international sans espaces', () => {
    expect(formatMoroccanPhone('+212661234567')).toBe('+212 661 234 567');
  });

  it('rejette un numéro invalide', () => {
    expect(() => formatMoroccanPhone('123')).toThrow(RangeError);
  });
});
