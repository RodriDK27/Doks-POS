import { ProductsService } from './products.service';

type MockProduct = { id: string; name: string; isFavorite?: boolean };

function makePrisma(
  products: MockProduct[],
  sold: Array<{ productId: string; quantity: number; count: number }>,
  options: { autoMinSales?: number; autoIds?: string[] } = {},
) {
  return {
    product: {
      findMany: jest.fn(() =>
        Promise.resolve(
          products.map((p) => ({ stock: 0, minStock: 0, unitType: 'PIECE', category: null, imageUrl: null, isFavorite: true, ...p })),
        ),
      ),
    },
    saleItem: {
      groupBy: jest.fn((args: { having?: unknown }) =>
        Promise.resolve(
          args.having
            ? (options.autoIds ?? []).map((productId) => ({ productId }))
            : sold.map((s) => ({ productId: s.productId, _sum: { quantity: s.quantity }, _count: { _all: s.count } })),
        ),
      ),
    },
    appSetting: {
      findUnique: jest.fn(() =>
        Promise.resolve(options.autoMinSales ? { key: 'favorites.autoMinSales', value: String(options.autoMinSales) } : null),
      ),
    },
  };
}

describe('ProductsService.getFavorites', () => {
  it('devuelve los favoritos del más al menos vendido, con 0 a los que no se han vendido', async () => {
    const prisma = makePrisma(
      [
        { id: 'a', name: 'Agua' },
        { id: 'c', name: 'Coca' },
        { id: 'f', name: 'Fanta' },
      ],
      [
        { productId: 'c', quantity: 40, count: 25 },
        { productId: 'f', quantity: 3, count: 2 },
      ],
    );
    const service = new ProductsService(prisma as never);

    const result = await service.getFavorites();

    expect(result.map((p) => [p.id, p.quantitySold, p.ticketCount, p.isAuto])).toEqual([
      ['c', 40, 25, false],
      ['f', 3, 2, false],
      ['a', 0, 0, false],
    ]);
    expect(prisma.saleItem.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { productId: { in: ['a', 'c', 'f'] } } }));
    // Sin mínimo configurado no se buscan productos automáticos
    expect(prisma.saleItem.groupBy).toHaveBeenCalledTimes(1);
  });

  it('limita las ventas a los últimos días pedidos y no consulta ventas si no hay favoritos', async () => {
    const prisma = makePrisma([{ id: 'c', name: 'Coca' }], []);
    const service = new ProductsService(prisma as never);

    await service.getFavorites(7);
    const where = (prisma.saleItem.groupBy.mock.calls[0] as unknown as [{ where: { sale?: { createdAt: { gte: Date } } } }])[0].where;
    const days = (Date.now() - where.sale!.createdAt.gte.getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(7);

    const empty = makePrisma([], []);
    expect(await new ProductsService(empty as never).getFavorites()).toEqual([]);
    expect(empty.saleItem.groupBy).not.toHaveBeenCalled();
  });

  it('agrega solos los productos que llegan al mínimo de ventas y los marca como automáticos', async () => {
    const prisma = makePrisma(
      [
        { id: 'c', name: 'Coca', isFavorite: true },
        { id: 'p', name: 'Pan', isFavorite: false },
      ],
      [
        { productId: 'p', quantity: 50, count: 35 },
        { productId: 'c', quantity: 20, count: 12 },
      ],
      { autoMinSales: 30, autoIds: ['p'] },
    );
    const service = new ProductsService(prisma as never);

    const result = await service.getFavorites(30);

    expect(result.map((p) => [p.id, p.isAuto])).toEqual([
      ['p', true],
      ['c', false],
    ]);
    const autoQuery = (prisma.saleItem.groupBy.mock.calls[0] as unknown as [{ having: unknown }])[0];
    expect(autoQuery.having).toEqual({ productId: { _count: { gte: 30 } } });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { OR: [{ isFavorite: true }, { id: { in: ['p'] } }] } }),
    );
  });
});
