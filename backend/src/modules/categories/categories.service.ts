import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UploadedImageFile, deleteImageFile, saveImageFile } from '../../common/images/image-storage';

@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Al iniciar el módulo, sincronizar/migrar automáticamente las categorías únicas 
   * existentes en la tabla Product hacia la tabla Category.
   */
  async onModuleInit() {
    try {
      const distinctProducts = await this.prisma.product.findMany({
        select: { category: true },
        distinct: ['category'],
      });

      const existingProductCategories = distinctProducts
        .map((p) => p.category?.trim())
        .filter((c): c is string => Boolean(c && c.length > 0));

      for (const catName of existingProductCategories) {
        await this.prisma.category.upsert({
          where: { name: catName },
          update: {},
          create: { name: catName, description: 'Categoría importada automáticamente' },
        });
      }
      this.logger.log(`Sincronización inicial de categorías completada.`);
    } catch (error) {
      this.logger.error(`Error durante la migración inicial de categorías:`, error);
    }
  }

  /**
   * Obtener todas las categorías ordenadas alfabéticamente
   */
  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Obtener una categoría por ID
   */
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`La categoría con ID "${id}" no existe.`);
    }

    return category;
  }

  /**
   * Crear una nueva categoría
   */
  async create(dto: CreateCategoryDto) {
    const name = dto.name.trim();

    const existing = await this.prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`La categoría "${name}" ya existe.`);
    }

    return this.prisma.category.create({
      data: {
        name,
        description: dto.description?.trim() || null,
      },
    });
  }

  /**
   * Actualizar una categoría existente
   */
  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.name) {
      const name = dto.name.trim();
      const existing = await this.prisma.category.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
          NOT: { id },
        },
      });

      if (existing) {
        throw new BadRequestException(`Ya existe otra categoría con el nombre "${name}".`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
      },
    });
  }

  /**
   * Eliminar una categoría por ID
   */
  async remove(id: string) {
    const category = await this.findOne(id);

    const deleted = await this.prisma.category.delete({
      where: { id },
    });
    await deleteImageFile(category.imageUrl);
    return deleted;
  }

  // ─── IMAGEN (MODO ABUELA) ───────────────────────────────────────────────────
  async setImage(id: string, file?: UploadedImageFile) {
    const category = await this.findOne(id);
    const imageUrl = await saveImageFile(`category-${id}`, file);
    const updated = await this.prisma.category.update({ where: { id }, data: { imageUrl } });
    await deleteImageFile(category.imageUrl);
    return updated;
  }

  async removeImage(id: string) {
    const category = await this.findOne(id);
    const updated = await this.prisma.category.update({ where: { id }, data: { imageUrl: null } });
    await deleteImageFile(category.imageUrl);
    return updated;
  }
}
