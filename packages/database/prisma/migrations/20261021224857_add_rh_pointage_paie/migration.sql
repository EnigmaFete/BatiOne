-- CreateEnum
CREATE TYPE "TypeContratWorker" AS ENUM ('CDI', 'CDD', 'JOURNALIER', 'TACHERON', 'ANAPEC', 'STAGE');

-- CreateEnum
CREATE TYPE "StatutWorker" AS ENUM ('ACTIF', 'INACTIF', 'CONGE', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "StatutPresence" AS ENUM ('PRESENT', 'DEMI_JOURNEE', 'ABSENT', 'CONGE_PAYE', 'CONGE_SANS_SOLDE', 'MALADIE', 'ACCIDENT_TRAVAIL');

-- CreateTable
CREATE TABLE "workers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "cin" TEXT,
    "cnss_num" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "poste" TEXT NOT NULL,
    "departement" TEXT,
    "type_contrat" "TypeContratWorker" NOT NULL DEFAULT 'JOURNALIER',
    "statut" "StatutWorker" NOT NULL DEFAULT 'ACTIF',
    "date_embauche" DATE,
    "date_fin_contrat" DATE,
    "salaire_base_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "taux_journalier_mad" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "taux_horaire_mad" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "banque" TEXT,
    "rib" TEXT,
    "nombre_deductions_ir" INTEGER NOT NULL DEFAULT 0,
    "adresse" TEXT,
    "ville" TEXT DEFAULT 'Casablanca',
    "contact_urgence_nom" TEXT,
    "contact_urgence_tel" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pointages" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT,
    "date_pointage" DATE NOT NULL,
    "notes" TEXT,
    "valide_par_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pointages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pointage_lignes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "pointage_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "statut_presence" "StatutPresence" NOT NULL DEFAULT 'PRESENT',
    "heures_normales" DECIMAL(4,2) NOT NULL DEFAULT 8.00,
    "heures_sup" DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    "cout_journee_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,

    CONSTRAINT "pointage_lignes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_acomptes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "project_id" TEXT,
    "date_acompte" DATE NOT NULL,
    "montant_mad" DECIMAL(10,2) NOT NULL,
    "mode_paiement" "ModePaiement" NOT NULL DEFAULT 'ESPECES',
    "motif" TEXT,
    "statut" "StatutOperationnel" NOT NULL DEFAULT 'ENREGISTRE',
    "deduit_paie" BOOLEAN NOT NULL DEFAULT false,
    "payslip_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_acomptes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "periode_mois" INTEGER NOT NULL,
    "periode_annee" INTEGER NOT NULL,
    "salaire_base_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "jours_travailles" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "taux_journalier_applique_mad" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "heures_sup_heures" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "heures_sup_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "primes_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "salaire_brut_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "cnss_salarie_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "amo_salarie_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "ir_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "acomptes_deduits_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "salaire_net_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "cnss_patronale_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "amo_patronale_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "charges_patronales_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "cout_total_employeur_mad" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "statut" "StatutOperationnel" NOT NULL DEFAULT 'BROUILLON',
    "soumis_par_id" TEXT,
    "soumis_le" TIMESTAMP(3),
    "approuve_par_id" TEXT,
    "approuve_le" TIMESTAMP(3),
    "enregistre_le" TIMESTAMP(3),
    "motif_rejet" TEXT,
    "extourne_de_id" TEXT,
    "motif_extourne" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workers_organization_id_statut_idx" ON "workers"("organization_id", "statut");

-- CreateIndex
CREATE INDEX "workers_organization_id_deleted_at_idx" ON "workers"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "workers_organization_id_matricule_key" ON "workers"("organization_id", "matricule");

-- CreateIndex
CREATE INDEX "pointages_organization_id_date_pointage_idx" ON "pointages"("organization_id", "date_pointage");

-- CreateIndex
CREATE INDEX "pointages_organization_id_project_id_idx" ON "pointages"("organization_id", "project_id");

-- CreateIndex
CREATE INDEX "pointage_lignes_organization_id_worker_id_idx" ON "pointage_lignes"("organization_id", "worker_id");

-- CreateIndex
CREATE UNIQUE INDEX "pointage_lignes_pointage_id_worker_id_key" ON "pointage_lignes"("pointage_id", "worker_id");

-- CreateIndex
CREATE INDEX "worker_acomptes_organization_id_worker_id_idx" ON "worker_acomptes"("organization_id", "worker_id");

-- CreateIndex
CREATE INDEX "worker_acomptes_organization_id_date_acompte_idx" ON "worker_acomptes"("organization_id", "date_acompte");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_extourne_de_id_key" ON "payslips"("extourne_de_id");

-- CreateIndex
CREATE INDEX "payslips_organization_id_statut_idx" ON "payslips"("organization_id", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_organization_id_worker_id_periode_annee_periode_mo_key" ON "payslips"("organization_id", "worker_id", "periode_annee", "periode_mois");

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pointage_lignes" ADD CONSTRAINT "pointage_lignes_pointage_id_fkey" FOREIGN KEY ("pointage_id") REFERENCES "pointages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pointage_lignes" ADD CONSTRAINT "pointage_lignes_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_acomptes" ADD CONSTRAINT "worker_acomptes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_acomptes" ADD CONSTRAINT "worker_acomptes_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_acomptes" ADD CONSTRAINT "worker_acomptes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_acomptes" ADD CONSTRAINT "worker_acomptes_payslip_id_fkey" FOREIGN KEY ("payslip_id") REFERENCES "payslips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_extourne_de_id_fkey" FOREIGN KEY ("extourne_de_id") REFERENCES "payslips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
