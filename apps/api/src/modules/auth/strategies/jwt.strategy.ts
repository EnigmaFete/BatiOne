import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';

export interface JwtAccessPayload {
  sub: string; // userId
  organizationId: string;
  role: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') ?? 'changeme_access_secret_dev_only',
    });
  }

  /**
   * Revalide systématiquement contre la base (compte actif, rôle courant) plutôt que de faire
   * confiance au seul contenu du JWT — une désactivation de compte ou un changement de rôle
   * doit couper l'accès immédiatement, pas seulement à l'expiration du jeton (TTL court de
   * toute façon, cf. .env.example JWT_ACCESS_TTL).
   */
  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.actif || user.deleted_at) {
      throw new UnauthorizedException({
        code: 'JETON_INVALIDE',
        message: 'Session invalide ou compte désactivé. Veuillez vous reconnecter.',
      });
    }

    return {
      userId: user.id,
      organizationId: user.organization_id,
      role: user.role,
      email: user.email,
    };
  }
}
