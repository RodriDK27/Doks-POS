import { Controller, Get, Post, Body, Patch, Put, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { ProductImagesService } from './product-images.service';
import { MAX_IMAGE_BYTES, UploadedImageFile } from '../../common/images/image-storage';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BulkProductsDto } from './dto/bulk-products.dto';
import { ProductsBulkService } from './products-bulk.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productImagesService: ProductImagesService,
    private readonly productsBulkService: ProductsBulkService,
  ) {}

  @Post()
  @Roles('ADMIN', 'GERENTE')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /** Importación masiva desde CSV — recibe un array de filas de producto */
  /** Editor avanzado: crea y actualiza hasta 250 productos por petición, en lotes */
  @Post('bulk')
  @Roles('ADMIN', 'GERENTE')
  bulkSave(@Body() body: BulkProductsDto) {
    return this.productsBulkService.bulkSave(body.rows);
  }

  @Post('import')
  @Roles('ADMIN', 'GERENTE')
  importProducts(@Body() body: { rows: CreateProductDto[] }) {
    return this.productsService.importProducts(body.rows);
  }

  /** Registrar merma, caducidad o consumo interno */
  @Post('waste')
  registerWaste(@Body() body: {
    productId: string;
    type: 'CONSUMO_INTERNO' | 'MERMA_ROTO' | 'MERMA_CADUCADO' | 'DEVOLUCION' | 'AJUSTE';
    quantity: number;
    responsibleName?: string;
    notes?: string;
  }) {
    return this.productsService.registerWaste(body);
  }

  /** Obtener reporte general de mermas y consumos */
  @Get('waste/report')
  getWasteReport(@Query('month') month?: string) {
    return this.productsService.getWasteReport(month);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.productsService.findAll(search, category);
  }

  @Get('low-stock')
  getLowStock() {
    return this.productsService.getLowStock();
  }

  @Get('sales-analytics')
  getSalesAnalytics() {
    return this.productsService.getSalesAnalytics();
  }

  @Get('categories')
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  /** Historial de movimientos de stock de un producto */
  @Get(':id/movements')
  getMovements(@Param('id') id: string) {
    return this.productsService.getMovements(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  /** Vincular un código de barras adicional (rápido para POS / Inventario) */
  @Post(':id/barcodes')
  addBarcode(
    @Param('id') id: string,
    @Body() body: { barcode: string; label?: string },
  ) {
    return this.productsService.addBarcode(id, body.barcode, body.label);
  }

  /** Desvincular un código de barras secundario */
  @Delete(':id/barcodes/:barcodeId')
  @Roles('ADMIN', 'GERENTE')
  removeBarcode(
    @Param('id') id: string,
    @Param('barcodeId') barcodeId: string,
  ) {
    return this.productsService.removeBarcode(id, barcodeId);
  }

  /** Subir o reemplazar la foto del producto (multipart, campo "image", WebP o JPEG ya comprimido por el frontend) */
  @Post(':id/image')
  @Roles('ADMIN', 'GERENTE')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file?: UploadedImageFile,
  ) {
    return this.productImagesService.setImage(id, file);
  }

  /** Quitar la foto del producto */
  @Delete(':id/image')
  @Roles('ADMIN', 'GERENTE')
  removeImage(@Param('id') id: string) {
    return this.productImagesService.removeImage(id);
  }

  /** Restablecer / actualizar stock rápido (para reposición express en POS o auditoría) */
  @Patch(':id/stock')
  @Roles('ADMIN', 'GERENTE', 'CAJERO')
  updateStock(
    @Param('id') id: string,
    @Body() body: { stock: number },
  ) {
    return this.productsService.update(id, { stock: Number(body.stock) });
  }

  @Patch(':id')
  @Roles('ADMIN', 'GERENTE', 'CAJERO')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'GERENTE')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
