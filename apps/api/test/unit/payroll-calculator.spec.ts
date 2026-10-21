import { TypeContratWorker } from '@batione/database';
import { calculerPaieMarocaine } from '../../src/modules/rh/payroll-calculator';

describe('Calculateur de Paie Marocaine (Unitaire)', () => {
  it('calcule correctement la paie d’un ouvrier journalier de chantier avec acompte', () => {
    const res = calculerPaieMarocaine({
      type_contrat: TypeContratWorker.JOURNALIER,
      salaire_base_mad: 0,
      taux_journalier_mad: 150,
      taux_horaire_mad: 0,
      jours_travailles: 20,
      heures_sup: 0,
      primes_mad: 0,
      nombre_deductions_ir: 0,
      total_acomptes_mad: 500,
    });

    // 20j * 150 MAD = 3 000 MAD brut
    expect(res.salaire_brut_mad).toBe(3000);
    // CNSS: 4.48% * 3000 = 134.40
    expect(res.cnss_salarie_mad).toBe(134.4);
    // AMO: 2.26% * 3000 = 67.80
    expect(res.amo_salarie_mad).toBe(67.8);
    // IR: SNI < 3333.33 MAD => 0 MAD
    expect(res.ir_mad).toBe(0);
    // Acompte déduit = 500 MAD
    expect(res.acomptes_deduits_mad).toBe(500);
    // Net: 3000 - 134.40 - 67.80 - 500 = 2297.80 MAD
    expect(res.salaire_net_mad).toBe(2297.8);
    // Coût patronal > 0
    expect(res.charges_patronales_mad).toBeGreaterThan(0);
    expect(res.cout_total_employeur_mad).toBe(res.salaire_brut_mad + res.charges_patronales_mad);
  });

  it('applique le plafond CNSS de 6 000 MAD pour les salaires élevés', () => {
    const res = calculerPaieMarocaine({
      type_contrat: TypeContratWorker.CDI,
      salaire_base_mad: 12000,
      taux_journalier_mad: 0,
      taux_horaire_mad: 0,
      jours_travailles: 26,
      heures_sup: 0,
      primes_mad: 0,
      nombre_deductions_ir: 2,
      total_acomptes_mad: 0,
    });

    expect(res.salaire_brut_mad).toBe(12000);
    // CNSS plafonnée à 6 000 MAD * 4.48% = 268.80 MAD
    expect(res.cnss_salarie_mad).toBe(268.8);
    // AMO non plafonnée: 12 000 * 2.26% = 271.20 MAD
    expect(res.amo_salarie_mad).toBe(271.2);
    // IR calculé et déduction 2 enfants (60 MAD)
    expect(res.ir_mad).toBeGreaterThan(0);
    expect(res.salaire_net_mad).toBeLessThan(12000);
    expect(res.salaire_net_mad).toBeGreaterThan(9000);
  });

  it('intègre les heures supplémentaires avec majoration légale de 25%', () => {
    const res = calculerPaieMarocaine({
      type_contrat: TypeContratWorker.JOURNALIER,
      salaire_base_mad: 0,
      taux_journalier_mad: 160, // 20 MAD/h
      taux_horaire_mad: 20,
      jours_travailles: 10,
      heures_sup: 8, // 8h * 20 * 1.25 = 200 MAD
      primes_mad: 100,
      nombre_deductions_ir: 0,
      total_acomptes_mad: 0,
    });

    expect(res.heures_sup_mad).toBe(200);
    expect(res.primes_mad).toBe(100);
    expect(res.salaire_brut_mad).toBe(1600 + 200 + 100);
  });
});
