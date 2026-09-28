import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductImagesService } from './product-images.service';
import { ProductsBulkService } from './products-bulk.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductImagesService, ProductsBulkService],
  exports: [ProductsService], // Exportamos el servicio para que el módulo de Ventas pueda ajustar stock
})
export class ProductsModule {}
