-- CreateEnum
CREATE TYPE "StatutOperationnel" AS ENUM ('BROUILLON', 'SOUMIS', 'APPROUVE', 'ENREGISTRE', 'EXTOURNE');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE', 'MOBILE', 'AUTRE');

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "date_depense" DATE NOT NULL,
    "montant_ht" DECIMAL(14,2) NOT NULL,
    "categorie_id" TEXT NOT NULL,
    "project_id" TEXT,
    "fournisseur" TEXT,
    "mode_paiement" "ModePaiement",
    "reference_piece" TEXT,
    "notes" TEXT,
    "statut" "StatutOperationnel" NOT NULL DEFAULT 'BROUILLON',
    "soumis_par_id" TEXT,
    "soumis_le" TIMESTAMP(3),
    "approuve_par_id" TEXT,
    "approuve_le" TIMESTAMP(3),
    "enregistre_le" TIMESTAMP(3),
    "motif_rejet" TEXT,
    "extourne_de_id" TEXT,
    "motif_extourne" TEXT,
    "idempotency_key" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_organization_id_nom_key" ON "expense_categories"("organization_id", "nom");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_extourne_de_id_key" ON "expenses"("extourne_de_id");

-- CreateIndex
CREATE INDEX "expenses_organization_id_statut_idx" ON "expenses"("organization_id", "statut");

-- CreateIndex
CREATE INDEX "expenses_organization_id_project_id_idx" ON "expenses"("organization_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_organization_id_idempotency_key_key" ON "expenses"("organization_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_extourne_de_id_fkey" FOREIGN KEY ("extourne_de_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
