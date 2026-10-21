-- CreateEnum
CREATE TYPE "TypeProjet" AS ENUM ('CONSTRUCTION', 'RENOVATION', 'EVENEMENTIEL', 'SERVICES', 'FOURNITURE', 'MAINTENANCE', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutProjet" AS ENUM ('BROUILLON', 'ACTIF', 'EN_PAUSE', 'TERMINE', 'ANNULE');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeProjet" NOT NULL DEFAULT 'AUTRE',
    "statut" "StatutProjet" NOT NULL DEFAULT 'BROUILLON',
    "client_nom" TEXT,
    "responsable_id" TEXT,
    "budget" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "date_debut" DATE,
    "date_fin_prevue" DATE,
    "date_fin_reelle" DATE,
    "description" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_organization_id_statut_idx" ON "projects"("organization_id", "statut");

-- CreateIndex
CREATE INDEX "projects_organization_id_deleted_at_idx" ON "projects"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "projects_organization_id_code_key" ON "projects"("organization_id", "code");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
