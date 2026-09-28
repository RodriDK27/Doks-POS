import { Controller, Get, Post, Body, Patch, Put, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MAX_IMAGE_BYTES, UploadedImageFile } from '../../common/images/image-storage';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles('ADMIN', 'GERENTE')
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get('schedule/today')
  getTodaySchedule() {
    return this.suppliersService.getTodaySchedule();
  }

  /** Lista para "Llegó el proveedor" del modo abuela (logo, monto de siempre, notas pendientes, si viene hoy) */
  @Get('simple')
  findForSimpleMode() {
    return this.suppliersService.findForSimpleMode();
  }

  /** Subir o reemplazar el logo (multipart, campo "image", WebP o JPEG ya comprimido por el frontend) */
  @Post(':id/logo')
  @Roles('ADMIN', 'GERENTE')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  uploadLogo(@Param('id') id: string, @UploadedFile() file?: UploadedImageFile) {
    return this.suppliersService.setLogo(id, file);
  }

  @Delete(':id/logo')
  @Roles('ADMIN', 'GERENTE')
  removeLogo(@Param('id') id: string) {
    return this.suppliersService.removeLogo(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Put(':id')
  @Patch(':id')
  @Roles('ADMIN', 'GERENTE')
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Post('pending-tickets')
  @Roles('ADMIN', 'GERENTE')
  createPendingTicket(@Body() dto: { supplierId: string; amount: number; scheduledDate?: string; notes?: string }) {
    return this.suppliersService.createPendingTicket(dto);
  }

  @Get('pending-tickets/active')
  findAllPendingTickets() {
    return this.suppliersService.findAllPendingTickets();
  }

  @Get('pending-tickets/history')
  findAllTicketsHistory() {
    return this.suppliersService.findAllTicketsHistory();
  }

  @Post('pending-tickets/:id/pay')
  @Roles('ADMIN', 'GERENTE')
  payPendingTicket(@Param('id') id: string, @Body() dto: { payFromRegister?: boolean; amountPaid?: number; paymentSource?: string }) {
    return this.suppliersService.payPendingTicket(id, dto);
  }

  @Delete('pending-tickets/:id')
  @Roles('ADMIN', 'GERENTE')
  cancelPendingTicket(@Param('id') id: string) {
    return this.suppliersService.cancelPendingTicket(id);
  }

  @Delete(':id')
  @Roles('ADMIN', 'GERENTE')
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
