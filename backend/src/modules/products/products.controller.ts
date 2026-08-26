import { Controller, Get, Post, Body, Patch, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('ADMIN', 'GERENTE')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /** Importación masiva desde CSV — recibe un array de filas de producto */
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
