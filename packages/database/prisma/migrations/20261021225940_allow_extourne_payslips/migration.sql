-- DropIndex
DROP INDEX "payslips_organization_id_worker_id_periode_annee_periode_mo_key";

-- CreateIndex
CREATE INDEX "payslips_organization_id_worker_id_periode_annee_periode_mo_idx" ON "payslips"("organization_id", "worker_id", "periode_annee", "periode_mois");
