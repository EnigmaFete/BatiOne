import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { PrismaClient, RoleUtilisateur } from '@batione/database';
import { AppModule } from '../../src/app.module';
import { configureTestApp } from '../utils/configure-test-app';

/**
 * Test d'intégration du flux d'authentification complet (PHASE_01.md §3).
 * Nécessite une base PostgreSQL réelle joignable via DATABASE_URL (docker-compose.yml fournit
 * un service `postgres` local) — ce test n'est jamais exécuté contre une base mockée.
 */
describe('Authentification (intégration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const email = `test.auth.${Date.now()}@batione.ma`;
  const motDePasse = 'MotDePasseSolide123!';
  let organizationId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureTestApp(moduleRef.createNestApplication());
    await app.init();

    prisma = new PrismaClient();
    const organization = await prisma.organization.create({
      data: { nom: 'Org Test Auth', ice: `ICE-AUTH-${Date.now()}` },
    });
    organizationId = organization.id;

    await prisma.user.create({
      data: {
        organization_id: organizationId,
        nom: 'Test',
        prenom: 'Utilisateur',
        email,
        password_hash: await argon2.hash(motDePasse),
        role: RoleUtilisateur.ORG_ADMIN,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { organization_id: organizationId } });
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
    await app.close();
  });

  it('refuse la connexion avec un mauvais mot de passe', async () => {
    const reponse = await request(app.getHttpServer())
      .post('/api/v1/auth/connexion')
      .send({ email, password: 'mauvais_mot_de_passe' });

    expect(reponse.status).toBe(401);
    expect(reponse.body.erreur.code).toBe('IDENTIFIANTS_INVALIDES');
  });

  it('connecte un utilisateur valide et renvoie un accessToken + cookie refresh', async () => {
    const reponse = await request(app.getHttpServer())
      .post('/api/v1/auth/connexion')
      .send({ email, password: motDePasse });

    expect(reponse.status).toBe(201);
    expect(reponse.body.donnees.accessToken).toBeDefined();
    expect(reponse.headers['set-cookie']?.[0]).toMatch(/batione_refresh=/);
  });

  it('rejette toute requête portant un en-tête X-Tenant-ID', async () => {
    const reponse = await request(app.getHttpServer())
      .post('/api/v1/auth/connexion')
      .set('X-Tenant-ID', 'org-arbitraire')
      .send({ email, password: motDePasse });

    expect(reponse.status).toBe(400);
    expect(reponse.body.erreur.code).toBe('TENANT_HEADER_NOT_ALLOWED');
  });

  it('refuse GET /auth/moi sans jeton', async () => {
    const reponse = await request(app.getHttpServer()).get('/api/v1/auth/moi');
    expect(reponse.status).toBe(401);
  });

  it('accepte GET /auth/moi avec un jeton valide et renvoie le profil + organisation', async () => {
    const connexion = await request(app.getHttpServer())
      .post('/api/v1/auth/connexion')
      .send({ email, password: motDePasse });

    const reponse = await request(app.getHttpServer())
      .get('/api/v1/auth/moi')
      .set('Authorization', `Bearer ${connexion.body.donnees.accessToken}`);

    expect(reponse.status).toBe(200);
    expect(reponse.body.donnees.email).toBe(email);
    expect(reponse.body.donnees.organization.id).toBe(organizationId);
  });

  it('verrouille le compte après 5 tentatives échouées consécutives', async () => {
    const emailVerrou = `test.verrou.${Date.now()}@batione.ma`;
    await prisma.user.create({
      data: {
        organization_id: organizationId,
        nom: 'Verrou',
        prenom: 'Test',
        email: emailVerrou,
        password_hash: await argon2.hash(motDePasse),
        role: RoleUtilisateur.LECTEUR,
      },
    });

    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/connexion')
        .send({ email: emailVerrou, password: 'mauvais' });
    }

    const reponse = await request(app.getHttpServer())
      .post('/api/v1/auth/connexion')
      .send({ email: emailVerrou, password: motDePasse });

    expect(reponse.status).toBe(403);
    expect(reponse.body.erreur.code).toBe('COMPTE_VERROUILLE');
  });
});
