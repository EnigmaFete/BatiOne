-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('SUPERADMIN', 'ORG_ADMIN', 'GESTIONNAIRE', 'CONDUCTEUR_TRAVAUX', 'CHEF_CHANTIER', 'DAF_COMPTABLE', 'RH_PAIE', 'MAGASINIER', 'GESTIONNAIRE_MATERIEL', 'EMPLOYE', 'LECTEUR');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ice" TEXT NOT NULL,
    "rc" TEXT,
    "if_num" TEXT,
    "patente" TEXT,
    "cnss_employeur" TEXT,
    "secteur_activite" TEXT,
    "adresse" TEXT,
    "ville" TEXT NOT NULL DEFAULT 'Casablanca',
    "telephone" TEXT,
    "email" TEXT,
    "devise" TEXT NOT NULL DEFAULT 'MAD',
    "langue_defaut" TEXT NOT NULL DEFAULT 'fr',
    "logo_url" TEXT,
    "rib" TEXT,
    "banque" TEXT,
    "numerotation_devis" TEXT NOT NULL DEFAULT 'DEV-{YYYY}-{SEQ:4}',
    "numerotation_facture" TEXT NOT NULL DEFAULT 'FAC-{YYYY}-{SEQ:4}',
    "payroll_config_validated_at" TIMESTAMP(3),
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "RoleUtilisateur" NOT NULL DEFAULT 'LECTEUR',
    "telephone" TEXT,
    "cin" TEXT,
    "langue_preferee" TEXT NOT NULL DEFAULT 'fr',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "derniere_connexion_at" TIMESTAMP(3),
    "tentatives_echouees" INTEGER NOT NULL DEFAULT 0,
    "verrouille_jusqu_a" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_ice_key" ON "organizations"("ice");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_role_idx" ON "users"("organization_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
