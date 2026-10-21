import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { RoleUtilisateur } from '@batione/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { ArticlesService } from './articles.service';
import { StockMovementsService } from './stock-movements.service';

const ROLES_GESTION_STOCK = [RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.GESTIONNAIRE, RoleUtilisateur.MAGASINIER];

@Controller()
export class StockController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  @Get('articles')
  listerArticles(@Query() query: ListArticlesQueryDto) {
    return this.articlesService.lister(query);
  }

  @Get('articles/selection')
  listerArticlesPourSelection() {
    return this.articlesService.listerPourSelection();
  }

  @Get('articles/:id')
  obtenirArticle(@Param('id') id: string) {
    return this.articlesService.obtenir(id);
  }

  @Post('articles')
  @Roles(...ROLES_GESTION_STOCK)
  creerArticle(@Body() dto: CreateArticleDto, @CurrentUser() user: AuthenticatedUser) {
    return this.articlesService.creer(dto, user.userId);
  }

  @Patch('articles/:id')
  @Roles(...ROLES_GESTION_STOCK)
  mettreAJourArticle(@Param('id') id: string, @Body() dto: UpdateArticleDto, @CurrentUser() user: AuthenticatedUser) {
    return this.articlesService.mettreAJour(id, dto, user.userId);
  }

  @Delete('articles/:id')
  @Roles(RoleUtilisateur.ORG_ADMIN, RoleUtilisateur.GESTIONNAIRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async archiverArticle(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.articlesService.archiver(id, user.userId);
  }

  @Get('mouvements-stock')
  listerMouvements(@Query('articleId') articleId?: string, @Query('projectId') projectId?: string) {
    return this.stockMovementsService.lister(articleId, projectId);
  }

  @Post('mouvements-stock')
  @Roles(...ROLES_GESTION_STOCK)
  enregistrerMouvement(@Body() dto: CreateStockMovementDto, @CurrentUser() user: AuthenticatedUser) {
    return this.stockMovementsService.enregistrer(dto, user.userId);
  }
}
