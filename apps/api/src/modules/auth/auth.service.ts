import { randomUUID, createHash } from 'crypto';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../common/prisma/prisma.service';

const MAX_TENTATIVES = 5;
const DUREE_VERROUILLAGE_MINUTES = 15;

export interface TokensEmis {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

interface MetaConnexion {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string, meta: MetaConnexion = {}): Promise<TokensEmis> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Message volontairement identique que l'email existe ou non — ne jamais confirmer
    // l'existence d'un compte à un attaquant.
    const erreurIdentifiants = new UnauthorizedException({
      code: 'IDENTIFIANTS_INVALIDES',
      message: 'Email ou mot de passe incorrect.',
    });

    if (!user || user.deleted_at) {
      throw erreurIdentifiants;
    }

    if (user.verrouille_jusqu_a && user.verrouille_jusqu_a > new Date()) {
      throw new ForbiddenException({
        code: 'COMPTE_VERROUILLE',
        message: `Compte temporairement verrouillé suite à plusieurs tentatives échouées. Réessayez après ${user.verrouille_jusqu_a.toLocaleTimeString('fr-MA')}.`,
      });
    }

    if (!user.actif) {
      throw new ForbiddenException({ code: 'COMPTE_DESACTIVE', message: 'Ce compte a été désactivé.' });
    }

    const motDePasseValide = await argon2.verify(user.password_hash, password);

    if (!motDePasseValide) {
      const tentatives = user.tentatives_echouees + 1;
      const verrouille = tentatives >= MAX_TENTATIVES;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          tentatives_echouees: verrouille ? 0 : tentatives,
          verrouille_jusqu_a: verrouille
            ? new Date(Date.now() + DUREE_VERROUILLAGE_MINUTES * 60_000)
            : null,
        },
      });
      throw erreurIdentifiants;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { tentatives_echouees: 0, verrouille_jusqu_a: null, derniere_connexion_at: new Date() },
    });

    return this.emettreJetons(user.id, user.organization_id, user.role, user.email, meta);
  }

  async rafraichir(refreshTokenRaw: string, meta: MetaConnexion = {}): Promise<TokensEmis> {
    const tokenHash = this.hashToken(refreshTokenRaw);
    const erreurJeton = new UnauthorizedException({
      code: 'JETON_INVALIDE',
      message: 'Session expirée. Veuillez vous reconnecter.',
    });

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revoked_at || stored.expires_at < new Date()) {
      throw erreurJeton;
    }

    if (!stored.user.actif || stored.user.deleted_at) {
      throw erreurJeton;
    }

    // Rotation : l'ancien jeton est révoqué immédiatement, un nouveau est émis (détection de
    // réutilisation : un jeton révoqué rejoué signale un vol de jeton).
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked_at: new Date() },
    });

    return this.emettreJetons(
      stored.user.id,
      stored.user.organization_id,
      stored.user.role,
      stored.user.email,
      meta,
    );
  }

  async deconnexion(refreshTokenRaw: string): Promise<void> {
    const tokenHash = this.hashToken(refreshTokenRaw);
    await this.prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  private async emettreJetons(
    userId: string,
    organizationId: string,
    role: string,
    email: string,
    meta: MetaConnexion,
  ): Promise<TokensEmis> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, organizationId, role, email },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'changeme_access_secret_dev_only',
        expiresIn: this.configService.get<string>('JWT_ACCESS_TTL') ?? '15m',
      },
    );

    const refreshTokenRaw = randomUUID();
    const refreshTtlMs = this.parseDureeMs(this.configService.get<string>('JWT_REFRESH_TTL') ?? '7d');
    const refreshTokenExpiresAt = new Date(Date.now() + refreshTtlMs);

    await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: this.hashToken(refreshTokenRaw),
        expires_at: refreshTokenExpiresAt,
        user_agent: meta.userAgent,
        ip_address: meta.ipAddress,
      },
    });

    return { accessToken, refreshToken: refreshTokenRaw, refreshTokenExpiresAt };
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private parseDureeMs(duree: string): number {
    const correspondance = /^(\d+)([smhd])$/.exec(duree);
    if (!correspondance) return 7 * 24 * 60 * 60 * 1000;
    const valeur = Number(correspondance[1]);
    const unites: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return valeur * unites[correspondance[2]];
  }
}
