-- Invariant D8 (ADR-002) : la quantité disponible d'un article ne peut jamais être négative.
-- Hors syntaxe déclarative standard du schéma Prisma (cf. ARCHITECTURE.md §4.2) — filet de
-- sécurité base de données, indépendant de la mise à jour conditionnelle atomique côté service.
ALTER TABLE "articles" ADD CONSTRAINT "quantite_disponible_non_negative" CHECK ("quantite_disponible" >= 0);
