/*
  Warnings:

  - You are about to drop the column `client_nom` on the `projects` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TypeClient" AS ENUM ('PARTICULIER', 'ENTREPRISE', 'ENTITE_PUBLIQUE');

-- CreateEnum
CREATE TYPE "ConditionsPaiement" AS ENUM ('COMPTANT', 'A_15_JOURS', 'A_30_JOURS', 'A_60_JOURS', 'A_90_JOURS');

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "client_nom",
ADD COLUMN     "client_id" TEXT;

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeClient" NOT NULL DEFAULT 'ENTREPRISE',
    "personne_contact" TEXT,
    "telephone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "region" TEXT,
    "ice" TEXT,
    "if_num" TEXT,
    "rc" TEXT,
    "cnss" TEXT,
    "conditions_paiement" "ConditionsPaiement" NOT NULL DEFAULT 'A_30_JOURS',
    "limite_credit" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clients_organization_id_deleted_at_idx" ON "clients"("organization_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
