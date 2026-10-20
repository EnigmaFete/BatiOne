/* eslint-disable no-console */
import { PrismaClient, RoleUtilisateur } from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();

/**
 * Jeu de données de démonstration pour le développement local uniquement — jamais exécuté
 * automatiquement en production (cf. package.json : pas de hook `postinstall`/`migrate deploy`).
 */
async function main(): Promise<void> {
  const organization = await prisma.organization.upsert({
    where: { ice: 'ICE-DEMO-0001' },
    update: {},
    create: {
      nom: 'BatiOne Démo SARL',
      ice: 'ICE-DEMO-0001',
      rc: 'RC-12345',
      if_num: 'IF-67890',
      ville: 'Casablanca',
      secteur_activite: 'CONSTRUCTION',
    },
  });

  const motDePasseHash = await hash('BatiOneDemo123!');

  await prisma.user.upsert({
    where: { email: 'admin@batione-demo.ma' },
    update: {},
    create: {
      organization_id: organization.id,
      nom: 'Alaoui',
      prenom: 'Admin',
      email: 'admin@batione-demo.ma',
      password_hash: motDePasseHash,
      role: RoleUtilisateur.ORG_ADMIN,
    },
  });

  console.log(`Organisation de démonstration prête : ${organization.nom} (${organization.id})`);
  console.log('Connexion : admin@batione-demo.ma / BatiOneDemo123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
