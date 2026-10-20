import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { PrismaClient, RoleUtilisateur } from '@batione/database';
import { AppModule } from '../../src/app.module';
import { configureTestApp } from '../utils/configure-test-app';

/**
 * Preuve d'exécution de l'invariant de sécurité §1.1 de SECURITY_MODEL.md :
 * "Aucune donnée d'une organisation A ne peut être lue, modifiée, inférée ou listée par un
 * utilisateur de l'organisation B." Contre une base PostgreSQL réelle, deux organisations
 * distinctes, deux utilisateurs distincts.
 */
describe('Isolation Multi-Tenant (sécurité)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  let orgA: { id: string };
  let orgB: { id: string };
  let jetonOrgA: string;
  let jetonOrgB: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureTestApp(moduleRef.createNestApplication());
    await app.init();

    prisma = new PrismaClient();
    const suffixe = Date.now();

    orgA = await prisma.organization.create({ data: { nom: 'Org A', ice: `ICE-A-${suffixe}` } });
    orgB = await prisma.organization.create({ data: { nom: 'Org B', ice: `ICE-B-${suffixe}` } });

    const motDePasse = 'MotDePasseSolide123!';
    const hash = await argon2.hash(motDePasse);

    await prisma.user.create({
      data: {
        organization_id: orgA.id,
        nom: 'A',
        prenom: 'Admin',
        email: `admin.a.${suffixe}@batione.ma`,
        password_hash: hash,
        role: RoleUtilisateur.ORG_ADMIN,
      },
    });
    await prisma.user.create({
      data: {
        organization_id: orgB.id,
        nom: 'B',
        prenom: 'Admin',
        email: `admin.b.${suffixe}@batione.ma`,
        password_hash: hash,
        role: RoleUtilisateur.ORG_ADMIN,
      },
    });

    const connexionA = await request(app.getHttpServer())
      .post('/api/v1/auth/connexion')
      .send({ email: `admin.a.${suffixe}@batione.ma`, password: motDePasse });
    const connexionB = await request(app.getHttpServer())
      .post('/api/v1/auth/connexion')
      .send({ email: `admin.b.${suffixe}@batione.ma`, password: motDePasse });

    jetonOrgA = connexionA.body.donnees.accessToken;
    jetonOrgB = connexionB.body.donnees.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { organization_id: { in: [orgA.id, orgB.id] } } });
    await prisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
    await prisma.$disconnect();
    await app.close();
  });

  it("interdit à l'utilisateur de l'organisation A de lister les utilisateurs de l'organisation B", async () => {
    const reponseA = await request(app.getHttpServer())
      .get('/api/v1/utilisateurs')
      .set('Authorization', `Bearer ${jetonOrgA}`);

    expect(reponseA.status).toBe(200);
    const emailsVisibles = (reponseA.body.donnees as Array<{ email: string }>).map((u) => u.email);
    expect(emailsVisibles.some((e) => e.includes('admin.b.'))).toBe(false);
  });

  it("interdit la modification d'un utilisateur de l'organisation B via un jeton de l'organisation A", async () => {
    const utilisateursB = await prisma.user.findMany({ where: { organization_id: orgB.id } });
    const cibleId = utilisateursB[0].id;

    const reponse = await request(app.getHttpServer())
      .patch(`/api/v1/utilisateurs/${cibleId}`)
      .set('Authorization', `Bearer ${jetonOrgA}`)
      .send({ actif: false });

    // Le TenantGuard restreint l'UPDATE à organization_id = A : la ligne de B ne matche jamais
    // la clause WHERE composée -> 404 (ressource introuvable), jamais 200.
    expect(reponse.status).toBe(404);

    const utilisateurIntact = await prisma.user.findUnique({ where: { id: cibleId } });
    expect(utilisateurIntact?.actif).toBe(true);
  });

  it("le profil d'organisation renvoyé par /organisation/profil correspond toujours au tenant du jeton", async () => {
    const reponseA = await request(app.getHttpServer())
      .get('/api/v1/organisation/profil')
      .set('Authorization', `Bearer ${jetonOrgA}`);
    const reponseB = await request(app.getHttpServer())
      .get('/api/v1/organisation/profil')
      .set('Authorization', `Bearer ${jetonOrgB}`);

    expect(reponseA.body.donnees.id).toBe(orgA.id);
    expect(reponseB.body.donnees.id).toBe(orgB.id);
    expect(reponseA.body.donnees.id).not.toBe(reponseB.body.donnees.id);
  });

  it('un jeton falsifié (organizationId arbitraire, signature invalide) est rejeté — 401, jamais 200', async () => {
    const jetonFalsifie = `${jetonOrgA.slice(0, -5)}AAAAA`;
    const reponse = await request(app.getHttpServer())
      .get('/api/v1/organisation/profil')
      .set('Authorization', `Bearer ${jetonFalsifie}`);

    expect(reponse.status).toBe(401);
  });
});
