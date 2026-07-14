import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // Exportamos el servicio para que el módulo de Ventas pueda ajustar stock
})
export class ProductsModule {}
