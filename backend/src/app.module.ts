import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './modules/products/products.module';
import { CustomersModule } from './modules/customers/customers.module';
import { RegisterModule } from './modules/register/register.module';
import { SalesModule } from './modules/sales/sales.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { AuthModule } from './modules/auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupModule } from './modules/backup/backup.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RequestedProductsModule } from './modules/requested-products/requested-products.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { VaultModule } from './modules/vault/vault.module';
import { DailyTemplatesModule } from './modules/daily-templates/daily-templates.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Habilitar programación cron en NestJS
    PrismaModule,
    ProductsModule,
    CategoriesModule,
    VaultModule,
    CustomersModule,
    RegisterModule,
    SalesModule,
    SuppliersModule,
    PurchasesModule,
    DailyTemplatesModule,
    AuthModule,
    BackupModule,
    ReportsModule,
    RequestedProductsModule,
    AttendanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
