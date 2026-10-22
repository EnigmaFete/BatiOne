import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { StatutProjet, RoleUtilisateur } from '@prisma/client';
import request from 'supertest';
import argon2 from 'argon2';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { configureTestApp } from '../utils/configure-test-app';

describe('Rapports — Synthèse Analytique Consolidée (intégration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenAdmin: string;
  let orgId: string;
  const emailAdmin = `admin.rep.${Date.now()}@batione.ma`;
  const mdp = 'Password123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureTestApp(moduleFixture.createNestApplication());
    await app.init();

    prisma = app.get(PrismaService);

    const org = await prisma.organization.create({
      data: {
        nom: 'Rapports BTP SARL',
        ice: `ICE-REP-${Date.now()}`,
      },
    });
    orgId = org.id;

    await prisma.user.create({
      data: {
        organization_id: orgId,
        nom: 'Bennani',
        prenom: 'Mehdi',
        email: emailAdmin,
        password_hash: await argon2.hash(mdp),
        role: RoleUtilisateur.ORG_ADMIN,
        actif: true,
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/connexion')
      .send({ email: emailAdmin, password: mdp });

    tokenAdmin = loginRes.body.donnees.accessToken;

    // Catégorie par défaut
    const cat = await prisma.expenseCategory.create({
      data: {
        organization_id: orgId,
        nom: 'Matériaux de construction',
      },
    });

    // Création d'un projet test
    const prj = await prisma.project.create({
      data: {
        organization_id: orgId,
        code: 'PRJ-REP-01',
        nom: 'Résidence Al Manar',
        statut: StatutProjet.ACTIF,
        budget: 2000000,
      },
    });

    // Dépense enregistrée
    await prisma.expense.create({
      data: {
        organization_id: orgId,
        project_id: prj.id,
        categorie_id: cat.id,
        montant_ht: 50000,
        date_depense: new Date(),
        statut: 'ENREGISTRE',
        notes: 'Achat acier et ferraille',
      },
    });

    // Ouvrier test
    await prisma.worker.create({
      data: {
        organization_id: orgId,
        matricule: 'WRK-REP-01',
        nom: 'Tazi',
        prenom: 'Omar',
        cin: `CIN${Date.now().toString().slice(-6)}`,
        poste: 'Maçon',
        type_contrat: 'CDI',
        salaire_base_mad: 5000,
        taux_journalier_mad: 200,
        taux_horaire_mad: 25,
        statut: 'ACTIF',
      },
    });

    // Article de stock
    await prisma.article.create({
      data: {
        organization_id: orgId,
        code: 'CIM-01',
        nom: 'Ciment CPJ 45',
        quantite_disponible: 100,
        prix_unitaire: 85,
        unite: 'SAC',
      },
    });
  });

  afterAll(async () => {
    if (orgId) {
      await prisma.stockMovement.deleteMany({ where: { organization_id: orgId } });
      await prisma.article.deleteMany({ where: { organization_id: orgId } });
      await prisma.pointageLigne.deleteMany({ where: { pointage: { organization_id: orgId } } });
      await prisma.pointage.deleteMany({ where: { organization_id: orgId } });
      await prisma.acompteWorker.deleteMany({ where: { organization_id: orgId } });
      await prisma.payslip.deleteMany({ where: { organization_id: orgId } });
      await prisma.worker.deleteMany({ where: { organization_id: orgId } });
      await prisma.expense.deleteMany({ where: { organization_id: orgId } });
      await prisma.expenseCategory.deleteMany({ where: { organization_id: orgId } });
      await prisma.project.deleteMany({ where: { organization_id: orgId } });
      await prisma.user.deleteMany({ where: { organization_id: orgId } });
      await prisma.organization.delete({ where: { id: orgId } });
    }
    await app.close();
  });

  it('GET /api/v1/rapports/synthese renvoie une synthèse chiffrée multi-modules exacte et isolée au tenant', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/rapports/synthese?periode=mois_courant')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    const synthese = res.body.donnees;
    expect(synthese).toBeDefined();

    // Chantiers
    expect(synthese.chantiers.total_projets).toBe(1);
    expect(synthese.chantiers.projets_en_cours).toBe(1);
    expect(synthese.chantiers.budget_total_mad).toBe(2000000);

    // Finance
    expect(synthese.finance.depenses_enregistrees_mad).toBe(50000);
    expect(synthese.finance.repartition_categories.length).toBeGreaterThanOrEqual(1);

    // RH
    expect(synthese.rh.effectif_total).toBe(1);
    expect(synthese.rh.permanents).toBe(1);

    // Stock
    expect(synthese.stock.total_articles).toBe(1);
    expect(synthese.stock.valeur_stock_mad).toBe(8500); // 100 * 85
  });

  it('GET /api/v1/rapports/synthese sans token est rejeté en 401', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/rapports/synthese')
      .expect(401);
  });
});
