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

function makePrisma(existing: Array<{ id: string; stock: number; barcodes?: Array<{ barcode: string }> }> = [], mainOwners: Array<{ id: string; name: string; barcode: string }> = []) {
  const calls: Record<string, unknown[]> = { createMany: [], update: [], movements: [] };
  const prisma = {
    product: {
      findMany: jest.fn(({ where }) => Promise.resolve(where.id ? existing : mainOwners)),
      createMany: jest.fn((args) => (calls.createMany.push(args), args)),
      update: jest.fn((args) => (calls.update.push(args), args)),
    },
    productBarcode: {
      findMany: jest.fn(() => Promise.resolve([])),
      deleteMany: jest.fn((args) => args),
      createMany: jest.fn((args) => args),
    },
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

  it('sincroniza los códigos secundarios: quita los que ya no van y agrega los nuevos, sin repetir el principal', async () => {
    const { prisma } = makePrisma([{ id: 'p1', stock: 0, barcodes: [{ barcode: 'viejo' }, { barcode: 'queda' }] }]);
    const service = new ProductsBulkService(prisma as never);

    const result = await service.bulkSave([
      row({ id: 'p1', barcode: '750', barcodes: ['queda', ' nuevo ', '750', 'nuevo'] }),
      row({ name: 'Otro', barcodes: ['x1'] }),
    ]);

    expect(result.errors).toEqual([]);
    expect(prisma.productBarcode.deleteMany).toHaveBeenCalledWith({ where: { productId: 'p1', barcode: { in: ['viejo'] } } });
    expect(prisma.productBarcode.createMany).toHaveBeenCalledWith({
      data: [
        { productId: 'p1', barcode: 'nuevo' },
        { productId: result.created[0].id, barcode: 'x1' },
      ],
    });
  });

  it('no toca los códigos secundarios si la fila no los manda, y rechaza uno que ya es de otra fila', async () => {
    const { prisma } = makePrisma([{ id: 'p1', stock: 0, barcodes: [{ barcode: 'viejo' }] }]);
    const service = new ProductsBulkService(prisma as never);

    const result = await service.bulkSave([row({ id: 'p1', barcode: '111' }), row({ name: 'Otro', barcodes: ['111'] })]);

    expect(result.errors.map((e) => e.index)).toEqual([1]);
    expect(prisma.productBarcode.deleteMany).not.toHaveBeenCalled();
    expect(prisma.productBarcode.createMany).not.toHaveBeenCalled();
  });

  it('marca como error una fila cuyo producto ya no existe', async () => {
    const { prisma } = makePrisma([]);
    const service = new ProductsBulkService(prisma as never);

    const result = await service.bulkSave([row({ id: 'borrado' })]);

    expect(result.errors).toEqual([{ index: 0, message: expect.stringContaining('ya no existe') }]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('ProductsBulkService.restock', () => {
  function makeRestockPrisma(existingIds: string[]) {
    const prisma = {
      product: {
        findMany: jest.fn(() => Promise.resolve(existingIds.map((id) => ({ id })))),
        update: jest.fn((args) => args),
      },
      stockMovement: { createMany: jest.fn((args) => args) },
      $transaction: jest.fn((ops: Array<{ where?: { id: string } }>) =>
        Promise.resolve(ops.map((op) => (op.where ? { id: op.where.id, stock: 99 } : { count: 1 }))),
      ),
    };
    return prisma;
  }

  it('suma con incremento, junta productos repetidos y registra una entrada por producto', async () => {
    const prisma = makeRestockPrisma(['coca', 'fanta']);
    const service = new ProductsBulkService(prisma as never);

    const result = await service.restock([
      { productId: 'coca', quantity: 12 },
      { productId: 'fanta', quantity: 6 },
      { productId: 'coca', quantity: 12 },
    ]);

    expect(prisma.product.update).toHaveBeenCalledTimes(2);
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'coca' }, data: { stock: { increment: 24 } } }),
    );
    expect(prisma.stockMovement.createMany).toHaveBeenCalledWith({
      data: [
        { productId: 'coca', type: 'ENTRADA', quantity: 24, reason: 'Agregado rápido' },
        { productId: 'fanta', type: 'ENTRADA', quantity: 6, reason: 'Agregado rápido' },
      ],
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result.updated).toEqual([
      { id: 'coca', stock: 99 },
      { id: 'fanta', stock: 99 },
    ]);
  });

  it('no toca nada si algún producto ya no existe', async () => {
    const prisma = makeRestockPrisma(['coca']);
    const service = new ProductsBulkService(prisma as never);

    await expect(
      service.restock([
        { productId: 'coca', quantity: 1 },
        { productId: 'borrado', quantity: 1 },
      ]),
    ).rejects.toThrow('ya no existe');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
