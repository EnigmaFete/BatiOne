-- CreateEnum
CREATE TYPE "TypeMouvementStock" AS ENUM ('ENTREE', 'SORTIE', 'AJUSTEMENT');

-- CreateEnum
CREATE TYPE "StatutEquipement" AS ENUM ('DISPONIBLE', 'AFFECTE', 'MAINTENANCE', 'HORS_SERVICE');

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT,
    "unite" TEXT NOT NULL DEFAULT 'u',
    "prix_unitaire" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "quantite_disponible" DECIMAL(12,3) NOT NULL DEFAULT 0.00,
    "seuil_alerte" DECIMAL(12,3) NOT NULL DEFAULT 0.00,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "type" "TypeMouvementStock" NOT NULL,
    "quantite" DECIMAL(12,3) NOT NULL,
    "cout_unitaire" DECIMAL(14,2),
    "project_id" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT,
    "statut" "StatutEquipement" NOT NULL DEFAULT 'DISPONIBLE',
    "cout_horaire_interne" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_assignments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "date_debut" DATE NOT NULL,
    "date_retour_prevu" DATE,
    "date_retour_reel" DATE,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "articles_organization_id_deleted_at_idx" ON "articles"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "articles_organization_id_code_key" ON "articles"("organization_id", "code");

-- CreateIndex
CREATE INDEX "stock_movements_organization_id_article_id_idx" ON "stock_movements"("organization_id", "article_id");

-- CreateIndex
CREATE INDEX "equipment_organization_id_deleted_at_idx" ON "equipment"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_organization_id_code_key" ON "equipment"("organization_id", "code");

-- CreateIndex
CREATE INDEX "equipment_assignments_organization_id_equipment_id_idx" ON "equipment_assignments"("organization_id", "equipment_id");

-- CreateIndex
CREATE INDEX "equipment_assignments_organization_id_project_id_idx" ON "equipment_assignments"("organization_id", "project_id");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
