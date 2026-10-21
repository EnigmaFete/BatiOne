import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { PrismaClient, RoleUtilisateur } from '@batione/database';
import { AppModule } from '../../src/app.module';
import { configureTestApp } from '../utils/configure-test-app';

/**
 * Preuve d'exécution du cycle à 4 états et de l'extourne (AGENTS.md §2.3, ADR-003) contre une
 * base PostgreSQL réelle — c'est l'invariant le plus critique du produit, jamais testé sur un
 * mock. Couvre : cycle complet, séparation des tâches, transitions invalides, rejet, immutabilité
 * après soumission, extourne symétrique, double-extourne bloquée, idempotence de la création.
 */
describe('Dépenses — cycle de vie à 4 états (intégration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let organizationId: string;
  let categorieId: string;
  const motDePasse = 'MotDePasseSolide123!';

  let jetonAdmin: string;
  let jetonDaf: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureTestApp(moduleRef.createNestApplication());
    await app.init();

    prisma = new PrismaClient();
    const suffixe = Date.now();
    const organization = await prisma.organization.create({
      data: { nom: 'Org Test Dépenses', ice: `ICE-DEP-${suffixe}` },
    });
    organizationId = organization.id;

    const categorie = await prisma.expenseCategory.create({
      data: { organization_id: organizationId, nom: 'Matériaux' },
    });
    categorieId = categorie.id;

    const hash = await argon2.hash(motDePasse);
    await prisma.user.create({
      data: {
        organization_id: organizationId,
        nom: 'Admin',
        prenom: 'Test',
        email: `admin.dep.${suffixe}@batione.ma`,
        password_hash: hash,
        role: RoleUtilisateur.ORG_ADMIN,
      },
    });
    await prisma.user.create({
      data: {
        organization_id: organizationId,
        nom: 'Daf',
        prenom: 'Test',
        email: `daf.dep.${suffixe}@batione.ma`,
        password_hash: hash,
        role: RoleUtilisateur.DAF_COMPTABLE,
      },
    });

    const connexionAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/connexion')
      .send({ email: `admin.dep.${suffixe}@batione.ma`, password: motDePasse });
    jetonAdmin = connexionAdmin.body.donnees.accessToken;

    const connexionDaf = await request(app.getHttpServer())
      .post('/api/v1/auth/connexion')
      .send({ email: `daf.dep.${suffixe}@batione.ma`, password: motDePasse });
    jetonDaf = connexionDaf.body.donnees.accessToken;
  });

  afterAll(async () => {
    await prisma.expense.deleteMany({ where: { organization_id: organizationId } });
    await prisma.expenseCategory.deleteMany({ where: { organization_id: organizationId } });
    await prisma.user.deleteMany({ where: { organization_id: organizationId } });
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
    await app.close();
  });

  async function creerDepenseBrouillon(montant = 1000) {
    const reponse = await request(app.getHttpServer())
      .post('/api/v1/depenses')
      .set('Authorization', `Bearer ${jetonAdmin}`)
      .send({ dateDepense: '2026-03-01', montantHt: montant, categorieId });
    return reponse.body.donnees.id as string;
  }

  it('respecte strictement la chaîne BROUILLON -> SOUMIS -> APPROUVE -> ENREGISTRE', async () => {
    const id = await creerDepenseBrouillon();

    const soumise = await request(app.getHttpServer())
      .post(`/api/v1/depenses/${id}/soumettre`)
      .set('Authorization', `Bearer ${jetonAdmin}`);
    expect(soumise.status).toBe(201);
    expect(soumise.body.donnees.statut).toBe('SOUMIS');

    const approuvee = await request(app.getHttpServer())
      .post(`/api/v1/depenses/${id}/approuver`)
      .set('Authorization', `Bearer ${jetonDaf}`);
    expect(approuvee.status).toBe(201);
    expect(approuvee.body.donnees.statut).toBe('APPROUVE');

    const enregistree = await request(app.getHttpServer())
      .post(`/api/v1/depenses/${id}/enregistrer`)
      .set('Authorization', `Bearer ${jetonDaf}`);
    expect(enregistree.status).toBe(201);
    expect(enregistree.body.donnees.statut).toBe('ENREGISTRE');
  });

  it("interdit à l'utilisateur ayant soumis d'approuver sa propre dépense (séparation des tâches)", async () => {
    const id = await creerDepenseBrouillon();
    await request(app.getHttpServer()).post(`/api/v1/depenses/${id}/soumettre`).set('Authorization', `Bearer ${jetonAdmin}`);

    const reponse = await request(app.getHttpServer())
      .post(`/api/v1/depenses/${id}/approuver`)
      .set('Authorization', `Bearer ${jetonAdmin}`);

    expect(reponse.status).toBe(403);
    expect(reponse.body.erreur.code).toBe('SEPARATION_DES_TACHES');
  });

  it('refuse une transition invalide (approuver une dépense encore en BROUILLON)', async () => {
    const id = await creerDepenseBrouillon();

    const reponse = await request(app.getHttpServer())
      .post(`/api/v1/depenses/${id}/approuver`)
      .set('Authorization', `Bearer ${jetonDaf}`);

    expect(reponse.status).toBe(400);
    expect(reponse.body.erreur.code).toBe('STATUT_INVALIDE_POUR_APPROBATION');
  });

  it('un rejet renvoie la dépense en BROUILLON avec le motif enregistré', async () => {
    const id = await creerDepenseBrouillon();
    await request(app.getHttpServer()).post(`/api/v1/depenses/${id}/soumettre`).set('Authorization', `Bearer ${jetonAdmin}`);

    const rejetee = await request(app.getHttpServer())
      .post(`/api/v1/depenses/${id}/rejeter`)
      .set('Authorization', `Bearer ${jetonDaf}`)
      .send({ motif: 'Justificatif manquant, à joindre avant re-soumission' });

    expect(rejetee.status).toBe(201);
    expect(rejetee.body.donnees.statut).toBe('BROUILLON');
    expect(rejetee.body.donnees.motif_rejet).toContain('Justificatif manquant');
  });

  it('interdit toute modification directe une fois la dépense soumise (immutabilité)', async () => {
    const id = await creerDepenseBrouillon();
    await request(app.getHttpServer()).post(`/api/v1/depenses/${id}/soumettre`).set('Authorization', `Bearer ${jetonAdmin}`);

    const reponse = await request(app.getHttpServer())
      .patch(`/api/v1/depenses/${id}`)
      .set('Authorization', `Bearer ${jetonAdmin}`)
      .send({ montantHt: 9999 });

    expect(reponse.status).toBe(400);
    expect(reponse.body.erreur.code).toBe('STATUT_INVALIDE_POUR_MODIFICATION');
  });

  it("l'extourne d'une dépense ENREGISTRÉE crée une nouvelle ligne symétrique, jamais une mutation de l'original", async () => {
    const id = await creerDepenseBrouillon(2500);
    await request(app.getHttpServer()).post(`/api/v1/depenses/${id}/soumettre`).set('Authorization', `Bearer ${jetonAdmin}`);
    await request(app.getHttpServer()).post(`/api/v1/depenses/${id}/approuver`).set('Authorization', `Bearer ${jetonDaf}`);
    await request(app.getHttpServer()).post(`/api/v1/depenses/${id}/enregistrer`).set('Authorization', `Bearer ${jetonDaf}`);

    const extourne = await request(app.getHttpServer())
      .post(`/api/v1/depenses/${id}/extourner`)
      .set('Authorization', `Bearer ${jetonDaf}`)
      .send({ motif: 'Erreur de saisie sur le montant initial' });

    expect(extourne.status).toBe(201);
    expect(extourne.body.donnees.statut).toBe('EXTOURNE');
    expect(extourne.body.donnees.extourne_de_id).toBe(id);
    expect(Number(extourne.body.donnees.montant_ht)).toBe(-2500);

    // L'original reste ENREGISTRE, inchangé — jamais muté par l'extourne.
    const original = await request(app.getHttpServer())
      .get(`/api/v1/depenses/${id}`)
      .set('Authorization', `Bearer ${jetonAdmin}`);
    expect(original.body.donnees.statut).toBe('ENREGISTRE');
    expect(Number(original.body.donnees.montant_ht)).toBe(2500);
  });

  it('bloque une seconde extourne sur une dépense déjà extournée', async () => {
    const id = await creerDepenseBrouillon(500);
    await request(app.getHttpServer()).post(`/api/v1/depenses/${id}/soumettre`).set('Authorization', `Bearer ${jetonAdmin}`);
    await request(app.getHttpServer()).post(`/api/v1/depenses/${id}/approuver`).set('Authorization', `Bearer ${jetonDaf}`);
    await request(app.getHttpServer()).post(`/api/v1/depenses/${id}/enregistrer`).set('Authorization', `Bearer ${jetonDaf}`);
    await request(app.getHttpServer())
      .post(`/api/v1/depenses/${id}/extourner`)
      .set('Authorization', `Bearer ${jetonDaf}`)
      .send({ motif: 'Première extourne légitime' });

    const seconde = await request(app.getHttpServer())
      .post(`/api/v1/depenses/${id}/extourner`)
      .set('Authorization', `Bearer ${jetonDaf}`)
      .send({ motif: 'Tentative de double extourne' });

    expect(seconde.status).toBe(409);
    expect(seconde.body.erreur.code).toBe('DEJA_EXTOURNE');
  });

  it("l'en-tête Idempotency-Key empêche la double création sur rejeu réseau", async () => {
    const cle = `test-idem-${Date.now()}`;
    const premiere = await request(app.getHttpServer())
      .post('/api/v1/depenses')
      .set('Authorization', `Bearer ${jetonAdmin}`)
      .set('Idempotency-Key', cle)
      .send({ dateDepense: '2026-03-02', montantHt: 777, categorieId });

    const seconde = await request(app.getHttpServer())
      .post('/api/v1/depenses')
      .set('Authorization', `Bearer ${jetonAdmin}`)
      .set('Idempotency-Key', cle)
      .send({ dateDepense: '2026-03-02', montantHt: 777, categorieId });

    expect(premiere.status).toBe(201);
    expect(seconde.status).toBe(201);
    expect(seconde.body.donnees.id).toBe(premiere.body.donnees.id);

    const total = await prisma.expense.count({ where: { organization_id: organizationId, idempotency_key: cle } });
    expect(total).toBe(1);
  });
});
