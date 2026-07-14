import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { RegisterModule } from '../register/register.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [RegisterModule, CustomersModule], // Importamos los otros módulos para usar sus servicios
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
