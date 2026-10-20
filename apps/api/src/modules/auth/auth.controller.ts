import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService, TokensEmis } from './auth.service';
import { LoginDto } from './dto/login.dto';

const REFRESH_COOKIE_NAME = 'batione_refresh';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('connexion')
  async connexion(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const tokens = await this.authService.login(dto.email, dto.password, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    this.poserCookieRefresh(res, tokens);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('rafraichir')
  async rafraichir(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedException({ code: 'JETON_INVALIDE', message: 'Aucune session active.' });
    }
    const tokens = await this.authService.rafraichir(refreshToken, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    this.poserCookieRefresh(res, tokens);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('deconnexion')
  async deconnexion(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ message: string }> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (refreshToken) {
      await this.authService.deconnexion(refreshToken);
    }
    res.clearCookie(REFRESH_COOKIE_NAME);
    return { message: 'Déconnexion réussie.' };
  }

  @Get('moi')
  async moi(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.userId },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedException({ code: 'JETON_INVALIDE', message: 'Utilisateur introuvable.' });
    }

    return {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      langue_preferee: user.langue_preferee,
      organization: {
        id: user.organization.id,
        nom: user.organization.nom,
        ice: user.organization.ice,
        devise: user.organization.devise,
        onboarding_complete: user.organization.onboarding_complete,
      },
    };
  }

  private poserCookieRefresh(res: Response, tokens: TokensEmis): void {
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: tokens.refreshTokenExpiresAt,
      path: '/api/v1/auth',
    });
  }
}
