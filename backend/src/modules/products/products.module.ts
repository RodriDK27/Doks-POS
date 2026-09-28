import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductImagesService } from './product-images.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductImagesService],
  exports: [ProductsService], // Exportamos el servicio para que el módulo de Ventas pueda ajustar stock
})
export class ProductsModule {}
