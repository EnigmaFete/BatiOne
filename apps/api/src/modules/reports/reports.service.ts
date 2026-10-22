import { Injectable } from '@nestjs/common';
import { Prisma, StatutProjet, StatutEquipement } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

export interface PeriodeFiltre {
  debut?: Date;
  fin?: Date;
  label: string;
}

export interface SyntheseRapport {
  filtre: {
    periode: string;
    project_id?: string;
    project_nom?: string;
  };
  chantiers: {
    total_projets: number;
    projets_en_cours: number;
    budget_total_mad: number;
    consommation_budgetaire_pct: number;
  };
  finance: {
    depenses_enregistrees_mad: number;
    depenses_en_cours_validation_mad: number;
    depenses_totales_mad: number;
    repartition_categories: {
      category_id: string;
      nom: string;
      couleur: string;
      total_mad: number;
      pourcentage: number;
    }[];
  };
  rh: {
    effectif_total: number;
    journaliers: number;
    permanents: number;
    cout_main_doeuvre_pointage_mad: number;
    masse_salariale_brute_mad: number;
    masse_salariale_nette_mad: number;
    charges_patronales_mad: number;
    acomptes_totaux_mad: number;
    acomptes_en_attente_mad: number;
  };
  stock: {
    total_articles: number;
    valeur_stock_mad: number;
    articles_en_alerte: number;
    articles_en_rupture: number;
  };
  materiel: {
    total_engins: number;
    engins_en_service: number;
    engins_en_maintenance: number;
    valeur_parc_mad: number;
    taux_utilisation_pct: number;
  };
}

const PALETTE_COULEURS = [
  '#b8860b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#84cc16'
];

@Injectable()
export class ReportsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  private calculerBornesPeriode(type?: string): PeriodeFiltre {
    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const mois = maintenant.getMonth(); // 0-indexé

    if (type === 'trimestre') {
      const trimestreIndex = Math.floor(mois / 3);
      const debut = new Date(annee, trimestreIndex * 3, 1);
      const fin = new Date(annee, (trimestreIndex + 1) * 3, 0, 23, 59, 59, 999);
      return { debut, fin, label: `Trimestre ${trimestreIndex + 1} ${annee}` };
    }

    if (type === 'annee_courante') {
      const debut = new Date(annee, 0, 1);
      const fin = new Date(annee, 11, 31, 23, 59, 59, 999);
      return { debut, fin, label: `Année ${annee}` };
    }

    if (type === 'tout') {
      return { label: 'Tout l’historique' };
    }

    // Par défaut : mois courant
    const debut = new Date(annee, mois, 1);
    const fin = new Date(annee, mois + 1, 0, 23, 59, 59, 999);
    return { debut, fin, label: `${maintenant.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}` };
  }

  async getSynthese(query?: { periode?: string; project_id?: string }): Promise<SyntheseRapport> {
    const bornes = this.calculerBornesPeriode(query?.periode);
    const projectId = query?.project_id || undefined;

    // 1. Chantiers & Projets
    const projets = await this.tenantPrisma.db.project.findMany({
      where: projectId ? { id: projectId } : undefined,
      select: { id: true, nom: true, statut: true, budget: true },
    });

    const totalProjets = projets.length;
    const projetsEnCours = projets.filter((p) => p.statut === StatutProjet.ACTIF).length;
    const budgetTotal = projets.reduce((acc, p) => acc + Number(p.budget || 0), 0);

    // 2. Dépenses & Finance
    const whereDepense: Prisma.ExpenseWhereInput = {
      ...(projectId ? { project_id: projectId } : {}),
      ...(bornes.debut && bornes.fin
        ? {
            date_depense: {
              gte: bornes.debut,
              lte: bornes.fin,
            },
          }
        : {}),
    };

    const depenses = await this.tenantPrisma.db.expense.findMany({
      where: whereDepense,
      include: { categorie: true },
    });

    let depensesEnregistrees = 0;
    let depensesEnCours = 0;
    const repartitionMap = new Map<string, { nom: string; couleur: string; total: number }>();

    let couleurIndex = 0;
    for (const d of depenses) {
      const montant = Number(d.montant_ht);
      if (d.statut === 'ENREGISTRE') {
        depensesEnregistrees += montant;
      } else if (d.statut === 'SOUMIS' || d.statut === 'APPROUVE') {
        depensesEnCours += montant;
      }

      // Cumul catégorie
      const catId = d.categorie_id || 'sans-categorie';
      const catNom = d.categorie?.nom || 'Non catégorisé';
      const couleur = PALETTE_COULEURS[couleurIndex % PALETTE_COULEURS.length];
      const existant = repartitionMap.get(catId) || { nom: catNom, couleur, total: 0 };
      existant.total += montant;
      repartitionMap.set(catId, existant);
      couleurIndex++;
    }

    const depensesTotales = depensesEnregistrees + depensesEnCours;
    const repartitionCategories = Array.from(repartitionMap.entries())
      .map(([catId, val]) => ({
        category_id: catId,
        nom: val.nom,
        couleur: val.couleur,
        total_mad: val.total,
        pourcentage: depensesTotales > 0 ? Math.round((val.total / depensesTotales) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.total_mad - a.total_mad);

    const consommationBudgetairePct = budgetTotal > 0
      ? Math.round((depensesEnregistrees / budgetTotal) * 1000) / 10
      : 0;

    // 3. RH & Paie
    const workers = await this.tenantPrisma.db.worker.findMany({
      where: { statut: 'ACTIF' },
    });
    const effectifTotal = workers.length;
    const journaliers = workers.filter((w) => w.type_contrat === 'JOURNALIER' || w.type_contrat === 'TACHERON').length;
    const permanents = workers.filter((w) => w.type_contrat === 'CDI' || w.type_contrat === 'CDD').length;

    // Coût pointages dans la période
    const wherePointage: Prisma.PointageLigneWhereInput = {
      ...(projectId ? { pointage: { project_id: projectId } } : {}),
      ...(bornes.debut && bornes.fin
        ? {
            pointage: {
              date_pointage: {
                gte: bornes.debut,
                lte: bornes.fin,
              },
            },
          }
        : {}),
    };

    const pointagesLignes = await this.tenantPrisma.db.pointageLigne.findMany({
      where: wherePointage,
      select: { cout_journee_mad: true },
    });

    const coutMainDoeuvre = pointagesLignes.reduce((acc, l) => acc + Number(l.cout_journee_mad), 0);

    // Bulletins de paie du mois ou de l'année
    const anneeCible = bornes.debut ? bornes.debut.getFullYear() : new Date().getFullYear();
    const moisCible = bornes.debut ? bornes.debut.getMonth() + 1 : new Date().getMonth() + 1;

    const payslips = await this.tenantPrisma.db.payslip.findMany({
      where: {
        periode_annee: anneeCible,
        ...(query?.periode === 'annee_courante' ? {} : { periode_mois: moisCible }),
        statut: { in: ['ENREGISTRE', 'APPROUVE'] },
      },
      select: {
        salaire_brut_mad: true,
        salaire_net_mad: true,
        charges_patronales_mad: true,
      },
    });

    const masseBrute = payslips.reduce((acc, p) => acc + Number(p.salaire_brut_mad), 0);
    const masseNette = payslips.reduce((acc, p) => acc + Number(p.salaire_net_mad), 0);
    const chargesPatronales = payslips.reduce((acc, p) => acc + Number(p.charges_patronales_mad), 0);

    // Acomptes
    const acomptes = await this.tenantPrisma.db.acompteWorker.findMany({
      where: projectId ? { project_id: projectId } : undefined,
    });
    const acomptesTotaux = acomptes.reduce((acc, a) => acc + Number(a.montant_mad), 0);
    const acomptesEnAttente = acomptes
      .filter((a) => !a.deduit_paie)
      .reduce((acc, a) => acc + Number(a.montant_mad), 0);

    // 4. Stock & Matériaux
    const articles = await this.tenantPrisma.db.article.findMany();
    const totalArticles = articles.length;
    let valeurStock = 0;
    let articlesEnAlerte = 0;
    let articlesEnRupture = 0;

    for (const art of articles) {
      const qte = Number(art.quantite_disponible);
      const prix = Number(art.prix_unitaire);
      valeurStock += qte * prix;
      if (qte <= 0) {
        articlesEnRupture++;
      } else if (art.seuil_alerte && qte <= Number(art.seuil_alerte)) {
        articlesEnAlerte++;
      }
    }

    // 5. Matériel & Engins
    const engins = await this.tenantPrisma.db.equipment.findMany();
    const totalEngins = engins.length;
    const enginsEnService = engins.filter((e) => e.statut === StatutEquipement.AFFECTE).length;
    const enginsEnMaintenance = engins.filter((e) => e.statut === StatutEquipement.MAINTENANCE).length;
    const valeurParc = engins.reduce((acc, e) => acc + (Number(e.cout_horaire_interne) * 100 || 0), 0);
    const tauxUtilisation = totalEngins > 0 ? Math.round((enginsEnService / totalEngins) * 100) : 0;

    const projetCible = projectId ? projets.find((p) => p.id === projectId) : undefined;

    return {
      filtre: {
        periode: bornes.label,
        project_id: projectId,
        project_nom: projetCible?.nom,
      },
      chantiers: {
        total_projets: totalProjets,
        projets_en_cours: projetsEnCours,
        budget_total_mad: budgetTotal,
        consommation_budgetaire_pct: consommationBudgetairePct,
      },
      finance: {
        depenses_enregistrees_mad: depensesEnregistrees,
        depenses_en_cours_validation_mad: depensesEnCours,
        depenses_totales_mad: depensesTotales,
        repartition_categories: repartitionCategories,
      },
      rh: {
        effectif_total: effectifTotal,
        journaliers,
        permanents,
        cout_main_doeuvre_pointage_mad: coutMainDoeuvre,
        masse_salariale_brute_mad: masseBrute,
        masse_salariale_nette_mad: masseNette,
        charges_patronales_mad: chargesPatronales,
        acomptes_totaux_mad: acomptesTotaux,
        acomptes_en_attente_mad: acomptesEnAttente,
      },
      stock: {
        total_articles: totalArticles,
        valeur_stock_mad: valeurStock,
        articles_en_alerte: articlesEnAlerte,
        articles_en_rupture: articlesEnRupture,
      },
      materiel: {
        total_engins: totalEngins,
        engins_en_service: enginsEnService,
        engins_en_maintenance: enginsEnMaintenance,
        valeur_parc_mad: valeurParc,
        taux_utilisation_pct: tauxUtilisation,
      },
    };
  }
}
