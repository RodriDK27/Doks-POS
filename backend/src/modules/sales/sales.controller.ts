import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto, ResolveSaleItemDto } from './dto/create-sale.dto';
import { ChangePaymentMethodDto, CreateSaleReturnDto } from './dto/sale-return.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @Get('dashboard-stats')
  @Roles('ADMIN')
  getDashboardStats() {
    return this.salesService.getDashboardStats();
  }

  @Get('profit-report')
  @Roles('ADMIN')
  getProfitReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.salesService.getProfitReport(startDate, endDate);
  }

  // Bandeja "Por aclarar": artículos del modo abuela cobrados sin saber el producto exacto
  @Get('pending-review')
  @Roles('ADMIN', 'GERENTE')
  findPendingReview() {
    return this.salesService.findPendingReview();
  }

  @Get('pending-review/count')
  @Roles('ADMIN', 'GERENTE')
  async countPendingReview() {
    return { count: await this.salesService.countPendingReview() };
  }

  @Post('items/:itemId/resolve')
  @Roles('ADMIN', 'GERENTE')
  resolvePendingItem(@Param('itemId', ParseUUIDPipe) itemId: string, @Body() dto: ResolveSaleItemDto) {
    return this.salesService.resolvePendingItem(itemId, dto.productId);
  }

  @Post('items/:itemId/dismiss')
  @Roles('ADMIN', 'GERENTE')
  dismissPendingItem(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.salesService.dismissPendingItem(itemId);
  }

  // Devolución o cambio: el cliente regresa artículos del ticket
  @Post(':id/returns')
  createReturn(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateSaleReturnDto) {
    return this.salesService.createReturn(id, dto);
  }

  // Corregir el método de pago si se cobró con el método equivocado
  @Patch(':id/payment-method')
  changePaymentMethod(@Param('id', ParseIntPipe) id: number, @Body() dto: ChangePaymentMethodDto) {
    return this.salesService.changePaymentMethod(id, dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }
}
