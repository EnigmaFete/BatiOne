import { formatMAD, formatDateMA } from '@batione/shared-types';

describe('formatMAD', () => {
  it('formate un montant entier au format marocain avec 2 décimales', () => {
    expect(formatMAD(1250)).toBe('1 250,00 MAD');
  });

  it('formate un montant décimal', () => {
    expect(formatMAD(1250.5)).toBe('1 250,50 MAD');
  });

  it('accepte une chaîne (ex. Prisma.Decimal.toString())', () => {
    expect(formatMAD('99.9')).toBe('99,90 MAD');
  });

  it('formate zéro', () => {
    expect(formatMAD(0)).toBe('0,00 MAD');
  });

  it('rejette une valeur non numérique', () => {
    expect(() => formatMAD('abc')).toThrow(RangeError);
  });
});

describe('formatDateMA', () => {
  it('formate une date au format JJ/MM/AAAA', () => {
    expect(formatDateMA(new Date('2026-03-05T00:00:00.000Z'))).toBe('05/03/2026');
  });
});
