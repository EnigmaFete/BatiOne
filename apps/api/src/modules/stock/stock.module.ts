import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { ArticlesService } from './articles.service';
import { StockMovementsService } from './stock-movements.service';

@Module({
  controllers: [StockController],
  providers: [ArticlesService, StockMovementsService],
})
export class StockModule {}
