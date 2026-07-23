import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Post('pending-tickets')
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
  payPendingTicket(@Param('id') id: string, @Body() dto: { payFromRegister?: boolean; amountPaid?: number }) {
    return this.suppliersService.payPendingTicket(id, dto);
  }

  @Delete('pending-tickets/:id')
  cancelPendingTicket(@Param('id') id: string) {
    return this.suppliersService.cancelPendingTicket(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
