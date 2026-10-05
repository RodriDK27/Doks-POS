import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MAX_IMAGE_BYTES, UploadedImageFile } from '../../common/images/image-storage';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'GERENTE')
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'GERENTE')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  /** Subir o reemplazar la imagen (multipart, campo "image", WebP o JPEG ya comprimido por el frontend) */
  @Post(':id/image')
  @Roles('ADMIN', 'GERENTE')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  uploadImage(@Param('id') id: string, @UploadedFile() file?: UploadedImageFile) {
    return this.categoriesService.setImage(id, file);
  }

  @Delete(':id/image')
  @Roles('ADMIN', 'GERENTE')
  removeImage(@Param('id') id: string) {
    return this.categoriesService.removeImage(id);
  }

  @Delete(':id')
  @Roles('ADMIN', 'GERENTE')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
