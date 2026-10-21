import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RejectTenantHeaderMiddleware } from './common/middleware/reject-tenant-header.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ExpenseCategoriesModule } from './modules/expense-categories/expense-categories.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { StockModule } from './modules/stock/stock.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { RhModule } from './modules/rh/rh.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    ClientsModule,
    ProjectsModule,
    ExpenseCategoriesModule,
    ExpensesModule,
    StockModule,
    EquipmentModule,
    RhModule,
    HealthModule,
  ],
  providers: [
    // Ordre d'application : JwtAuthGuard (authentification) avant RolesGuard (autorisation) —
    // Nest exécute les guards globaux dans l'ordre de déclaration.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RejectTenantHeaderMiddleware).forRoutes('*');
  }
}
