import { ProductsBulkService } from './products-bulk.service';
import { BulkProductRowDto } from './dto/bulk-products.dto';

const row = (overrides: Partial<BulkProductRowDto>): BulkProductRowDto => ({
  name: 'Producto',
  unitType: 'PIECE',
  purchasePrice: 10,
  sellPrice: 15,
  stock: 0,
  ...overrides,
});

function makePrisma(existing: Array<{ id: string; stock: number }> = [], mainOwners: Array<{ id: string; name: string; barcode: string }> = []) {
  const calls: Record<string, unknown[]> = { createMany: [], update: [], movements: [] };
  const prisma = {
    product: {
      findMany: jest.fn(({ where }) => Promise.resolve(where.id ? existing : mainOwners)),
      createMany: jest.fn((args) => (calls.createMany.push(args), args)),
      update: jest.fn((args) => (calls.update.push(args), args)),
    },
    productBarcode: { findMany: jest.fn(() => Promise.resolve([])) },
    stockMovement: { createMany: jest.fn((args) => (calls.movements.push(args), args)) },
    $transaction: jest.fn(() => Promise.resolve([])),
  };
  return { prisma, calls };
}

describe('ProductsBulkService', () => {
  it('crea productos nuevos con su movimiento de stock inicial y actualiza los existentes con un ajuste', async () => {
    const { prisma, calls } = makePrisma([{ id: 'p1', stock: 5 }]);
    const service = new ProductsBulkService(prisma as never);

    const result = await service.bulkSave([row({ name: 'Nuevo', stock: 3 }), row({ id: 'p1', name: 'Viejo', stock: 8 })]);

    expect(result.errors).toEqual([]);
    expect(result.created).toHaveLength(1);
    expect(result.updated).toEqual([{ index: 1, id: 'p1' }]);
    const movements = (calls.movements[0] as { data: Array<{ type: string; quantity: number }> }).data;
    expect(movements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'ENTRADA', quantity: 3 }),
        expect.objectContaining({ type: 'AJUSTE', quantity: 3 }),
      ])
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('rechaza códigos repetidos en la tanda y códigos que ya pertenecen a otro producto', async () => {
    const { prisma } = makePrisma([], [{ id: 'otro', name: 'Coca', barcode: '750' }]);
    const service = new ProductsBulkService(prisma as never);

    const result = await service.bulkSave([
      row({ barcode: '111' }),
      row({ barcode: '111' }),
      row({ barcode: '750' }),
    ]);

    expect(result.created.map((c) => c.index)).toEqual([0]);
    expect(result.errors.map((e) => e.index)).toEqual([1, 2]);
    expect(result.errors[1].message).toContain('Coca');
  });

  it('marca como error una fila cuyo producto ya no existe', async () => {
    const { prisma } = makePrisma([]);
    const service = new ProductsBulkService(prisma as never);

    const result = await service.bulkSave([row({ id: 'borrado' })]);

    expect(result.errors).toEqual([{ index: 0, message: expect.stringContaining('ya no existe') }]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
