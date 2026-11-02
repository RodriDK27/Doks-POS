import { Controller, Get, Post, Body, Patch, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { RequestedProductsService } from './requested-products.service';
import { CreateRequestedProductDto } from './dto/create-requested-product.dto';
import { UpdateRequestedProductDto } from './dto/update-requested-product.dto';
import { BulkDeleteRequestedProductsDto } from './dto/bulk-delete-requested-products.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('requested-products')
@UseGuards(JwtAuthGuard)
export class RequestedProductsController {
  constructor(private readonly service: RequestedProductsService) {}

  @Post()
  create(@Body() dto: CreateRequestedProductDto) {
    return this.service.create(dto);
  }

  /** Borra varias solicitudes de una vez (POST porque DELETE con cuerpo no es fiable en proxies) */
  @Post('bulk-delete')
  removeMany(@Body() dto: BulkDeleteRequestedProductsDto) {
    return this.service.removeMany(dto.ids);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRequestedProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
