import { TypeContratWorker } from '@batione/database';

export interface ParametresPaieMaroc {
  type_contrat: TypeContratWorker;
  salaire_base_mad: number;
  taux_journalier_mad: number;
  taux_horaire_mad: number;
  jours_travailles: number;
  heures_sup: number;
  primes_mad: number;
  nombre_deductions_ir: number;
  total_acomptes_mad: number;
}

export interface ResultatPaieMaroc {
  salaire_base_mad: number;
  jours_travailles: number;
  taux_journalier_applique_mad: number;
  heures_sup_heures: number;
  heures_sup_mad: number;
  primes_mad: number;
  salaire_brut_mad: number;
  cnss_salarie_mad: number;
  amo_salarie_mad: number;
  ir_mad: number;
  acomptes_deduits_mad: number;
  salaire_net_mad: number;
  cnss_patronale_mad: number;
  amo_patronale_mad: number;
  charges_patronales_mad: number;
  cout_total_employeur_mad: number;
}

function arrondir(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}

/**
 * Moteur de calcul de la paie marocaine (Code du Travail & Code Général des Impôts - CGI Maroc).
 *
 * Règles appliquées :
 * - Rémunération brute :
 *   - Pour Journalier / Tâcheron : jours_travailles * taux_journalier
 *   - Pour CDI / CDD / ANAPEC / Stage : salaire_base_mad mensuel (ou taux journalier si jours renseignés sans salaire mensuel)
 * - Heures supplémentaires : base horaire avec majoration 25% légale (1.25x)
 * - CNSS Salarié : 4,48% plafonné à 6 000,00 MAD de salaire brut (max 268,80 MAD)
 * - AMO Salarié : 2,26% sans plafond
 * - Frais professionnels : 35% du salaire brut, plafonné légalement à 2 916,67 MAD/mois (35 000 MAD/an)
 * - Barème IR marocain mensuel avec déduction pour charge de famille (30 MAD/personne, max 180 MAD)
 * - Déduction des acomptes perçus
 * - Charges patronales : CNSS Prestations (8,98% plafonné à 6000 MAD) + Allocations familiales (6,40%) + TFP (1,60%) + AMO (4,11%)
 */
export function calculerPaieMarocaine(params: ParametresPaieMaroc): ResultatPaieMaroc {
  const isJournalier =
    params.type_contrat === TypeContratWorker.JOURNALIER ||
    params.type_contrat === TypeContratWorker.TACHERON;

  let salaireBaseLigne = 0;
  const tauxJournalierApplique = params.taux_journalier_mad;

  if (isJournalier) {
    salaireBaseLigne = arrondir(params.jours_travailles * params.taux_journalier_mad);
  } else {
    // Si c'est un salarié mensuel qui a un salaire de base
    if (params.salaire_base_mad > 0) {
      salaireBaseLigne = params.salaire_base_mad;
    } else if (params.taux_journalier_mad > 0) {
      salaireBaseLigne = arrondir(params.jours_travailles * params.taux_journalier_mad);
    }
  }

  // Taux horaire de référence
  let tauxHoraireRef = params.taux_horaire_mad;
  if (tauxHoraireRef <= 0) {
    if (params.taux_journalier_mad > 0) {
      tauxHoraireRef = params.taux_journalier_mad / 8;
    } else if (params.salaire_base_mad > 0) {
      // 26 jours ouvrables * 8 heures = 208h / mois (convention BTP & Code du travail 2288h/an)
      tauxHoraireRef = params.salaire_base_mad / 191; // Base légale marocaine 191h/mois
    }
  }

  // Heures sup avec majoration normale 25% (ou 1.25x le taux horaire de base)
  const heuresSupMad = arrondir(params.heures_sup * tauxHoraireRef * 1.25);
  const primesMad = arrondir(params.primes_mad);

  // Salaire Brut Global (SBG)
  const salaireBrut = arrondir(salaireBaseLigne + heuresSupMad + primesMad);

  // CNSS Salarié (4,48% plafonné à 6 000 MAD)
  const plafondCnss = 6000;
  const brutPlafonneCnss = Math.min(salaireBrut, plafondCnss);
  const cnssSalarie = arrondir(brutPlafonneCnss * 0.0448);

  // AMO Salarié (2,26% non plafonné)
  const amoSalarie = arrondir(salaireBrut * 0.0226);

  const totalCotisationsSalariales = arrondir(cnssSalarie + amoSalarie);

  // Frais professionnels (35% plafonné à 2 916,67 MAD/mois)
  const plafondFraisPro = 2916.67;
  const fraisPro = Math.min(arrondir(salaireBrut * 0.35), plafondFraisPro);

  // Salaire Net Imposable (SNI)
  const sni = Math.max(0, arrondir(salaireBrut - totalCotisationsSalariales - fraisPro));

  // Barème IR mensuel marocain de référence
  // 0 à 3 333,33 : 0% - 0
  // 3 333,34 à 5 000,00 : 10% - 333,33
  // 5 000,01 à 6 666,67 : 20% - 833,33
  // 6 666,68 à 8 333,33 : 30% - 1 500,00
  // 8 333,34 à 15 000,00 : 34% - 1 833,33
  // > 15 000,00 : 37% - 2 283,33
  let irBrut = 0;
  if (sni <= 3333.33) {
    irBrut = 0;
  } else if (sni <= 5000.0) {
    irBrut = sni * 0.1 - 333.33;
  } else if (sni <= 6666.67) {
    irBrut = sni * 0.2 - 833.33;
  } else if (sni <= 8333.33) {
    irBrut = sni * 0.3 - 1500.0;
  } else if (sni <= 15000.0) {
    irBrut = sni * 0.34 - 1833.33;
  } else {
    irBrut = sni * 0.37 - 2283.33;
  }
  irBrut = Math.max(0, arrondir(irBrut));

  // Déductions pour charges de famille (30 MAD par personne à charge, max 6 personnes = 180 MAD)
  const nbCharges = Math.min(Math.max(0, params.nombre_deductions_ir), 6);
  const deductionChargesFamille = nbCharges * 30;
  const irNet = Math.max(0, arrondir(irBrut - deductionChargesFamille));

  // Acomptes déduits : déduit les acomptes dans la limite du net disponible
  const netAvantAcomptes = Math.max(0, arrondir(salaireBrut - totalCotisationsSalariales - irNet));
  const acomptesDeduits = Math.min(arrondir(params.total_acomptes_mad), netAvantAcomptes);

  // Salaire Net à Payer
  const salaireNet = arrondir(netAvantAcomptes - acomptesDeduits);

  // Charges patronales marocaines
  // CNSS Prestations : 8,98% plafonné à 6000 MAD
  const cnssPatronalePrestations = arrondir(brutPlafonneCnss * 0.0898);
  // Allocations familiales : 6,40% non plafonné
  const allocsFamiliales = arrondir(salaireBrut * 0.064);
  // Taxe formation professionnelle : 1,60% non plafonné
  const tfp = arrondir(salaireBrut * 0.016);
  // Total CNSS employeur = Prestations + Allocations + TFP
  const cnssPatronaleTotale = arrondir(cnssPatronalePrestations + allocsFamiliales + tfp);

  // AMO Patronale : 4,11% non plafonné (composé de 2,26% part patronale + 1,85% participation AMO)
  const amoPatronale = arrondir(salaireBrut * 0.0411);

  const chargesPatronales = arrondir(cnssPatronaleTotale + amoPatronale);
  const coutTotalEmployeur = arrondir(salaireBrut + chargesPatronales);

  return {
    salaire_base_mad: salaireBaseLigne,
    jours_travailles: params.jours_travailles,
    taux_journalier_applique_mad: tauxJournalierApplique,
    heures_sup_heures: params.heures_sup,
    heures_sup_mad: heuresSupMad,
    primes_mad: primesMad,
    salaire_brut_mad: salaireBrut,
    cnss_salarie_mad: cnssSalarie,
    amo_salarie_mad: amoSalarie,
    ir_mad: irNet,
    acomptes_deduits_mad: acomptesDeduits,
    salaire_net_mad: salaireNet,
    cnss_patronale_mad: cnssPatronaleTotale,
    amo_patronale_mad: amoPatronale,
    charges_patronales_mad: chargesPatronales,
    cout_total_employeur_mad: coutTotalEmployeur,
  };
}
