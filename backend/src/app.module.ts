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

@Module({
  imports: [
    ScheduleModule.forRoot(), // Habilitar programación cron en NestJS
    PrismaModule,
    ProductsModule,
    CustomersModule,
    RegisterModule,
    SalesModule,
    SuppliersModule,
    PurchasesModule,
    AuthModule,
    BackupModule,
    ReportsModule,
    RequestedProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
