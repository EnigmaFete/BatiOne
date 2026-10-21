import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { PrismaClient, RoleUtilisateur, StatutPresence, TypeContratWorker } from '@batione/database';
import { AppModule } from '../../src/app.module';
import { configureTestApp } from '../utils/configure-test-app';

describe('RH, Pointage & Paie Marocaine (Intégration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let organizationId: string;
  const motDePasse = 'SecuriteBatiOne2026!';

  let jetonAdmin: string;
  let jetonDaf: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureTestApp(moduleRef.createNestApplication());
    await app.init();

    prisma = new PrismaClient();
    const suffixe = Date.now();
    const organization = await prisma.organization.create({
      data: { nom: 'BatiMaroc Travaux SARL', ice: `ICE-RH-${suffixe}` },
    });
    organizationId = organization.id;

    const hash = await argon2.hash(motDePasse);
    const admin = await prisma.user.create({
      data: {
        organization_id: organizationId,
        email: `admin-rh-${suffixe}@batione.ma`,
        nom: 'El Fassi',
        prenom: 'Karim',
        password_hash: hash,
        role: RoleUtilisateur.ORG_ADMIN,
      },
    });

    const daf = await prisma.user.create({
      data: {
        organization_id: organizationId,
        email: `daf-rh-${suffixe}@batione.ma`,
        nom: 'Berrada',
        prenom: 'Amina',
        password_hash: hash,
        role: RoleUtilisateur.DAF_COMPTABLE,
      },
    });

    const resLoginAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/connexion')
      .send({ email: admin.email, password: motDePasse })
      .expect(201);
    jetonAdmin = resLoginAdmin.body.donnees.accessToken;

    const resLoginDaf = await request(app.getHttpServer())
      .post('/api/v1/auth/connexion')
      .send({ email: daf.email, password: motDePasse })
      .expect(201);
    jetonDaf = resLoginDaf.body.donnees.accessToken;
  });

  afterAll(async () => {
    if (organizationId) {
      await prisma.organization.delete({ where: { id: organizationId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
    await app.close();
  });

  let workerId: string;

  it('crée un travailleur avec CIN marocain et taux journalier BTP', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/workers')
      .set('Authorization', `Bearer ${jetonAdmin}`)
      .send({
        nom: 'Tahiri',
        prenom: 'Youssef',
        cin: 'BK123456',
        cnss_num: '123456789',
        poste: 'Maçon',
        type_contrat: TypeContratWorker.JOURNALIER,
        taux_journalier_mad: 180,
        taux_horaire_mad: 22.5,
        banque: 'Attijariwafa Bank',
        rib: '007780000123456789012345',
      })
      .expect(201);

    expect(res.body.donnees.id).toBeDefined();
    expect(res.body.donnees.cin).toBe('BK123456');
    expect(res.body.donnees.matricule).toBeDefined();
    expect(Number(res.body.donnees.taux_journalier_mad)).toBe(180);
    workerId = res.body.donnees.id;
  });

  it('rejette la création d’un second collaborateur avec le même CIN dans l’organisation', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/workers')
      .set('Authorization', `Bearer ${jetonAdmin}`)
      .send({
        nom: 'Autre',
        prenom: 'Personne',
        cin: 'bk123456', // Test de la normalisation en majuscules
        poste: 'Ferrailleur',
        type_contrat: TypeContratWorker.JOURNALIER,
      })
      .expect(409);
  });

  it('enregistre un pointage quotidien batch pour l’équipe', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/pointages/batch')
      .set('Authorization', `Bearer ${jetonAdmin}`)
      .send({
        date_pointage: '2026-03-10',
        notes: 'Chantier Casa Anfa - coulage dalle béton',
        lignes: [
          {
            worker_id: workerId,
            statut_presence: StatutPresence.PRESENT,
            heures_normales: 8,
            heures_sup: 2,
          },
        ],
      })
      .expect(201);

    expect(res.body.donnees.presents).toBe(1);
    expect(res.body.donnees.lignes).toHaveLength(1);
    expect(res.body.donnees.lignes[0].statut_presence).toBe('PRESENT');
  });

  it('enregistre un acompte sur salaire remis sur chantier', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/acomptes')
      .set('Authorization', `Bearer ${jetonAdmin}`)
      .send({
        worker_id: workerId,
        date_acompte: '2026-03-15',
        montant_mad: 100,
        motif: 'Avance transport',
      })
      .expect(201);

    expect(res.body.donnees.id).toBeDefined();
    expect(Number(res.body.donnees.montant_mad)).toBe(100);
    expect(res.body.donnees.deduit_paie).toBe(false);
  });

  let payslipId: string;

  it('génère automatiquement la paie du mois en croisant pointages et acomptes', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/paie/generer')
      .set('Authorization', `Bearer ${jetonAdmin}`)
      .send({
        periode_annee: 2026,
        periode_mois: 3,
      })
      .expect(201);

    expect(res.body.donnees.total_bulletins).toBe(1);
    const b = res.body.donnees.bulletins[0];
    expect(b.worker_id).toBe(workerId);
    expect(Number(b.jours_travailles)).toBe(1); // 1 pointage enregistré
    expect(Number(b.heures_sup_heures)).toBe(2);
    expect(Number(b.acomptes_deduits_mad)).toBe(100);
    expect(Number(b.salaire_net_mad)).toBeGreaterThan(0);
    expect(b.statut).toBe('BROUILLON');
    payslipId = b.id;
  });

  it('exécute le cycle à 4 états : soumission, séparation des tâches, approbation, enregistrement et extourne', async () => {
    // 1. Soumission par l'administrateur
    await request(app.getHttpServer())
      .post(`/api/v1/paie/bulletins/${payslipId}/soumettre`)
      .set('Authorization', `Bearer ${jetonAdmin}`)
      .expect(201);

    // 2. Séparation des tâches : l'admin ne peut pas approuver son propre bulletin soumis
    await request(app.getHttpServer())
      .post(`/api/v1/paie/bulletins/${payslipId}/approuver`)
      .set('Authorization', `Bearer ${jetonAdmin}`)
      .expect(403);

    // 3. Approbation par le DAF
    await request(app.getHttpServer())
      .post(`/api/v1/paie/bulletins/${payslipId}/approuver`)
      .set('Authorization', `Bearer ${jetonDaf}`)
      .expect(201);

    // 4. Enregistrement (scellement définitif)
    await request(app.getHttpServer())
      .post(`/api/v1/paie/bulletins/${payslipId}/enregistrer`)
      .set('Authorization', `Bearer ${jetonDaf}`)
      .expect(201);

    // Vérifier que l'acompte est marqué comme déduit
    const acomptesApres = await request(app.getHttpServer())
      .get(`/api/v1/acomptes?worker_id=${workerId}`)
      .set('Authorization', `Bearer ${jetonAdmin}`)
      .expect(200);
    expect(acomptesApres.body.donnees[0].deduit_paie).toBe(true);

    // 5. Extourne contrôlée
    const resExtourne = await request(app.getHttpServer())
      .post(`/api/v1/paie/bulletins/${payslipId}/extourner`)
      .set('Authorization', `Bearer ${jetonDaf}`)
      .send({ motif_extourne: 'Erreur sur le taux journalier convenu' })
      .expect(201);

    expect(resExtourne.body.donnees.statut).toBe('EXTOURNE');
    expect(resExtourne.body.donnees.extourne_de_id).toBe(payslipId);
    expect(Number(resExtourne.body.donnees.salaire_net_mad)).toBeLessThan(0);

    // Vérifier que l'acompte a été libéré suite à l'extourne
    const acomptesApresExtourne = await request(app.getHttpServer())
      .get(`/api/v1/acomptes?worker_id=${workerId}`)
      .set('Authorization', `Bearer ${jetonAdmin}`)
      .expect(200);
    expect(acomptesApresExtourne.body.donnees[0].deduit_paie).toBe(false);
  });
});
