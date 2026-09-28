import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PurchasesService } from './purchases.service';
import { AddPurchaseDetailDto, CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { MAX_IMAGE_BYTES, UploadedImageFile } from '../../common/images/image-storage';

@Controller('purchases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'GERENTE', 'CAJERO')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(@Body() createPurchaseDto: CreatePurchaseDto) {
    return this.purchasesService.create(createPurchaseDto);
  }

  @Get()
  findAll() {
    return this.purchasesService.findAll();
  }

  // Pagos del modo abuela que todavía no tienen sus productos capturados
  @Get('pending-detail')
  @Roles('ADMIN', 'GERENTE')
  findPendingDetail() {
    return this.purchasesService.findPendingDetail();
  }

  @Get('pending-detail/count')
  @Roles('ADMIN', 'GERENTE')
  async countPendingDetail() {
    return { count: await this.purchasesService.countPendingDetail() };
  }

  /** Foto de la nota del proveedor (multipart, campo "image", WebP o JPEG ya comprimido por el frontend) */
  @Post(':id/receipt')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  uploadReceipt(@Param('id', ParseUUIDPipe) id: string, @UploadedFile() file?: UploadedImageFile) {
    return this.purchasesService.setReceipt(id, file);
  }

  @Post(':id/detail')
  @Roles('ADMIN', 'GERENTE')
  addDetail(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddPurchaseDetailDto) {
    return this.purchasesService.addDetail(id, dto);
  }
}
