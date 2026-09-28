import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkProductRowDto } from './dto/bulk-products.dto';

export interface BulkSaveResult {
  created: Array<{ index: number; id: string }>;
  updated: Array<{ index: number; id: string }>;
  errors: Array<{ index: number; message: string }>;
}

/** Filas escritas por transacción: suficientes para ir rápido sin transacciones enormes */
const WRITE_CHUNK = 100;

/**
 * Guardado masivo del editor avanzado de inventario.
 * A diferencia de la importación CSV (fila por fila), valida todo con pocas consultas y escribe en lotes:
 * cientos de artículos se guardan en un par de segundos.
 */
@Injectable()
export class ProductsBulkService {
  constructor(private readonly prisma: PrismaService) {}

  async bulkSave(rows: BulkProductRowDto[]): Promise<BulkSaveResult> {
    const result: BulkSaveResult = { created: [], updated: [], errors: [] };
    const fail = (index: number, message: string) => result.errors.push({ index, message });

    const clean = rows.map((row) => ({
      ...row,
      name: row.name.trim(),
      barcode: row.barcode?.trim() || null,
      category: row.category?.trim() || null,
    }));

    // 1. Productos a actualizar (una sola consulta)
    const ids = clean.map((r) => r.id).filter((id): id is string => !!id);
    const existing = ids.length
      ? await this.prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, stock: true } })
      : [];
    const existingById = new Map(existing.map((p) => [p.id, p]));

    // 2. Códigos de barras: repetidos en la misma tanda y ya usados por otros productos (dos consultas)
    const barcodes = clean.map((r) => r.barcode).filter((b): b is string => !!b);
    const [mainOwners, secondaryOwners] = barcodes.length
      ? await Promise.all([
          this.prisma.product.findMany({ where: { barcode: { in: barcodes } }, select: { id: true, name: true, barcode: true } }),
          this.prisma.productBarcode.findMany({
            where: { barcode: { in: barcodes } },
            select: { barcode: true, productId: true, product: { select: { name: true } } },
          }),
        ])
      : [[], []];
    const ownerByBarcode = new Map<string, { id: string; name: string }>();
    for (const p of mainOwners) ownerByBarcode.set(p.barcode!, { id: p.id, name: p.name });
    for (const b of secondaryOwners) ownerByBarcode.set(b.barcode, { id: b.productId, name: b.product.name });

    const firstRowByBarcode = new Map<string, number>();
    const valid: Array<{ index: number; row: (typeof clean)[number] }> = [];

    clean.forEach((row, index) => {
      if (row.id && !existingById.has(row.id)) {
        return fail(index, 'Este producto ya no existe (quizá lo borraron).');
      }
      if (row.barcode) {
        const previous = firstRowByBarcode.get(row.barcode);
        if (previous !== undefined) {
          return fail(index, `El código "${row.barcode}" está repetido en la fila ${previous + 1}.`);
        }
        firstRowByBarcode.set(row.barcode, index);
        const owner = ownerByBarcode.get(row.barcode);
        if (owner && owner.id !== row.id) {
          return fail(index, `El código "${row.barcode}" ya pertenece a "${owner.name}".`);
        }
      }
      valid.push({ index, row });
    });

    // 3. Escritura por lotes: cada lote es una transacción (todo o nada dentro del lote)
    for (let start = 0; start < valid.length; start += WRITE_CHUNK) {
      const chunk = valid.slice(start, start + WRITE_CHUNK);
      const ops: Prisma.PrismaPromise<unknown>[] = [];
      const movements: Prisma.StockMovementCreateManyInput[] = [];
      const chunkCreated: BulkSaveResult['created'] = [];
      const chunkUpdated: BulkSaveResult['updated'] = [];

      const toCreate: Prisma.ProductCreateManyInput[] = [];
      for (const { index, row } of chunk) {
        const data = {
          name: row.name,
          unitType: row.unitType,
          barcode: row.barcode,
          purchasePrice: row.purchasePrice,
          sellPrice: row.sellPrice,
          stock: row.stock,
          category: row.category,
        };

        if (row.id) {
          ops.push(this.prisma.product.update({ where: { id: row.id }, data }));
          const diff = row.stock - existingById.get(row.id)!.stock;
          if (Math.abs(diff) > 1e-9) {
            movements.push({ productId: row.id, type: 'AJUSTE', quantity: diff, reason: 'Ajuste en editor avanzado' });
          }
          chunkUpdated.push({ index, id: row.id });
        } else {
          // El id se genera aquí para poder crear todo con un solo createMany y devolverlo a su fila
          const id = randomUUID();
          toCreate.push({ id, ...data });
          if (row.stock > 0) {
            movements.push({ productId: id, type: 'ENTRADA', quantity: row.stock, reason: 'Stock inicial (editor avanzado)' });
          }
          chunkCreated.push({ index, id });
        }
      }

      if (toCreate.length) ops.unshift(this.prisma.product.createMany({ data: toCreate }));
      if (movements.length) ops.push(this.prisma.stockMovement.createMany({ data: movements }));

      try {
        await this.prisma.$transaction(ops);
        result.created.push(...chunkCreated);
        result.updated.push(...chunkUpdated);
      } catch (error) {
        // Ej. alguien registró el mismo código mientras se editaba: se marca el lote y los demás siguen
        const message =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
            ? 'Un código de barras de este grupo ya existe. Revísalo y vuelve a guardar.'
            : 'No se pudo guardar este grupo de productos. Intenta de nuevo.';
        for (const { index } of chunk) fail(index, message);
      }
    }

    result.errors.sort((a, b) => a.index - b.index);
    return result;
  }
}
