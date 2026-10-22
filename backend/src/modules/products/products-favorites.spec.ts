import { ProductsService } from './products.service';

function makePrisma(products: Array<{ id: string; name: string }>, sold: Array<{ productId: string; quantity: number; count: number }>) {
  return {
    product: {
      findMany: jest.fn(() => Promise.resolve(products.map((p) => ({ stock: 0, minStock: 0, unitType: 'PIECE', category: null, imageUrl: null, ...p })))),
    },
    saleItem: {
      groupBy: jest.fn(() =>
        Promise.resolve(sold.map((s) => ({ productId: s.productId, _sum: { quantity: s.quantity }, _count: { _all: s.count } }))),
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

    expect(result.map((p) => [p.id, p.quantitySold, p.ticketCount])).toEqual([
      ['c', 40, 25],
      ['f', 3, 2],
      ['a', 0, 0],
    ]);
    expect(prisma.saleItem.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { productId: { in: ['a', 'c', 'f'] } } }));
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
});
