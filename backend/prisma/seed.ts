import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcryptjs';

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
let prisma: PrismaClient;

if (
  dbUrl.startsWith('postgresql:') || 
  dbUrl.startsWith('postgres:') || 
  dbUrl.startsWith('mysql:')
) {
  process.env.DATABASE_URL = dbUrl;
  prisma = new PrismaClient();
} else {
  const adapter = new PrismaBetterSqlite3({
    url: dbUrl,
  });
  prisma = new PrismaClient({ adapter });
}

async function main() {
  console.log('Iniciando sembrado de base de datos (seeding)...');

  // 1. Sembrar Usuario Administrador por defecto si no existe
  const adminPinHash = await bcrypt.hash('1234', 10);

  const existingAdmin = await prisma.user.findFirst({ where: { name: 'Administrador' } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'Administrador',
        pin: adminPinHash,
        role: 'ADMIN',
      },
    });
  }

  console.log('✔ Usuarios creados/actualizados.');

  // 2. Sembrar Productos Realistas
  const products = [
    {
      barcode: '7501055300075',
      name: 'Coca Cola Original 600ml',
      description: 'Refresco sabor cola botella no retornable',
      purchasePrice: 13.5,
      sellPrice: 18.0,
      wholesalePrice: 16.5,
      stock: 45,
      minStock: 10,
      category: 'BEBIDAS',
    },
    {
      barcode: '7501000111206',
      name: 'Leche Entera Lala 1L',
      description: 'Leche ultra pasteurizada adicionada con vitamina A y D',
      purchasePrice: 20.0,
      sellPrice: 26.0,
      wholesalePrice: 24.5,
      stock: 24,
      minStock: 8,
      category: 'ABARROTES',
    },
    {
      barcode: '7501011115569',
      name: 'Papas Sabritas Sal 110g',
      description: 'Papas fritas con sal de mesa',
      purchasePrice: 32.0,
      sellPrice: 42.0,
      wholesalePrice: 39.0,
      stock: 30,
      minStock: 5,
      category: 'SABRITAS',
    },
    {
      barcode: '7501031302826',
      name: 'Aceite Nutrioli 1L',
      description: 'Aceite puro de soya comestible',
      purchasePrice: 34.0,
      sellPrice: 45.0,
      wholesalePrice: 41.5,
      stock: 15,
      minStock: 5,
      category: 'ABARROTES',
    },
    {
      barcode: '7501005111003',
      name: 'Jabón Zote Blanco 400g',
      description: 'Jabón de lavandería blanco neutro',
      purchasePrice: 18.5,
      sellPrice: 24.5,
      wholesalePrice: 22.0,
      stock: 20,
      minStock: 4,
      category: 'LIMPIEZA',
    },
    {
      barcode: '7501001402228',
      name: 'Galletas Chokis 57g',
      description: 'Galletas con chispas sabor chocolate',
      purchasePrice: 11.0,
      sellPrice: 15.0,
      wholesalePrice: 13.5,
      stock: 50,
      minStock: 10,
      category: 'ABARROTES',
    },
    {
      barcode: '7501008023648',
      name: 'Atún Herdez en Agua 130g',
      description: 'Atún aleta amarilla en trozos en agua',
      purchasePrice: 16.0,
      sellPrice: 21.0,
      wholesalePrice: 19.5,
      stock: 40,
      minStock: 10,
      category: 'ABARROTES',
    },
    {
      barcode: '7501032902889',
      name: 'Cloralex El Rendidor 950ml',
      description: 'Cloro líquido blanqueador desinfectante',
      purchasePrice: 14.0,
      sellPrice: 19.0,
      wholesalePrice: 17.5,
      stock: 18,
      minStock: 5,
      category: 'LIMPIEZA',
    },
    {
      barcode: '7501009228806',
      name: 'Pan Blanco Bimbo Grande',
      description: 'Pan de caja blanco grande 680g',
      purchasePrice: 38.0,
      sellPrice: 48.0,
      wholesalePrice: 45.0,
      stock: 12,
      minStock: 4,
      category: 'ABARROTES',
    },
    {
      barcode: '7501020515152',
      name: 'Detergente Ariel 1kg',
      description: 'Detergente en polvo concentrado oxi-azul',
      purchasePrice: 31.0,
      sellPrice: 40.0,
      wholesalePrice: 37.0,
      stock: 15,
      minStock: 3,
      category: 'LIMPIEZA',
    },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { barcode: prod.barcode },
      update: {
        purchasePrice: prod.purchasePrice,
        sellPrice: prod.sellPrice,
        wholesalePrice: prod.wholesalePrice,
        stock: prod.stock,
      },
      create: prod,
    });
  }

  console.log('✔ Productos sembrados.');

  // 3. Sembrar Proveedores
  const suppliers = [
    { name: 'Grupo Bimbo S.A.', phone: '5512345678', address: 'Av. Ejército Nacional 1130, CDMX' },
    { name: 'Femsa Coca-Cola', phone: '8183286000', address: 'Monterrey, NL' },
    { name: 'Distribuidora Abarrotera del Centro', phone: '4429876543', address: 'Querétaro, Qro.' },
  ];

  const dbSuppliers = [];
  for (const sup of suppliers) {
    const s = await prisma.supplier.upsert({
      where: { name: sup.name },
      update: {},
      create: sup,
    });
    dbSuppliers.push(s);
  }
  console.log('✔ Proveedores sembrados.');

  // 4. Sembrar Clientes
  const customers = [
    { name: 'Juan Pérez López', phone: '4421112233', address: 'Calle Independencia 45, Querétaro', creditLimit: 2000, currentDebt: 0 },
    { name: 'María Gómez Estrada', phone: '4425556677', address: 'Av. Zaragoza 128, Querétaro', creditLimit: 1000, currentDebt: 450 },
    { name: 'Pedro Domínguez Ruiz', phone: '4429990011', address: 'Colonia Alamos Calle 3 #12', creditLimit: 0, currentDebt: 0 },
  ];

  const dbCustomers = [];
  for (const cust of customers) {
    const existingCust = await prisma.customer.findFirst({ where: { name: cust.name } });
    let c;
    if (existingCust) {
      c = await prisma.customer.update({
        where: { id: existingCust.id },
        data: {
          phone: cust.phone,
          address: cust.address,
          creditLimit: cust.creditLimit,
          currentDebt: cust.currentDebt,
        },
      });
    } else {
      c = await prisma.customer.create({
        data: cust,
      });
    }
    dbCustomers.push(c);
  }
  console.log('✔ Clientes sembrados.');

  const maria = dbCustomers.find((c) => c.name === 'María Gómez Estrada');
  if (maria) {
    const existingTx = await prisma.creditTransaction.findFirst({
      where: { customerId: maria.id },
    });
    if (!existingTx) {
      await prisma.creditTransaction.create({
        data: {
          customerId: maria.id,
          amount: -450.0,
          type: 'DEUDA',
          notes: 'Saldo deudor inicial migrado durante sembrado de base de datos',
        },
      });
    }
  }

  // 5. Sembrar Historial de Caja Registradora Cerrada
  const pastRegister = await prisma.cashRegister.findFirst({
    where: { openedBy: 'Cajero de Mañana' },
  });

  if (!pastRegister) {
    const cr = await prisma.cashRegister.create({
      data: {
        openedBy: 'Cajero de Mañana',
        openedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hace 24 horas
        closedAt: new Date(Date.now() - 16 * 60 * 60 * 1000), // Hace 16 horas
        initialBalance: 500.0,
        expectedBalance: 750.0,
        actualBalance: 750.0,
        status: 'CERRADO',
        notes: 'Arqueo de caja perfecto. Turno matutino completo.',
      },
    });

    const sale = await prisma.sale.create({
      data: {
        total: 250.0,
        discount: 0,
        paymentMethod: 'EFECTIVO',
        amountPaid: 300.0,
        change: 50.0,
        cashRegisterId: cr.id,
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      },
    });

    await prisma.saleItem.create({
      data: {
        saleId: sale.id,
        productName: 'Coca Cola Original 600ml',
        price: 18.0,
        quantity: 5,
        total: 90.0,
      },
    });

    await prisma.saleItem.create({
      data: {
        saleId: sale.id,
        productName: 'Aceite Nutrioli 1L',
        price: 45.0,
        quantity: 3,
        total: 135.0,
      },
    });

    await prisma.saleItem.create({
      data: {
        saleId: sale.id,
        productName: 'Galletas Chokis 57g',
        price: 15.0,
        quantity: 1.66,
        total: 25.0,
      },
    });

    console.log('✔ Sesión de caja histórica sembrada.');
  }

  console.log('\x1b[32m[ÉXITO] Sembrado de base de datos finalizado correctamente.\x1b[0m\n');
}

main()
  .catch((e) => {
    console.error('Error durante el sembrado de base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
