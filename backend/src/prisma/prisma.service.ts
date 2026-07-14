import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
    
    // Si la cadena de conexión apunta a PostgreSQL o MySQL, instanciar Prisma de forma nativa
    if (
      dbUrl.startsWith('postgresql:') || 
      dbUrl.startsWith('postgres:') || 
      dbUrl.startsWith('mysql:')
    ) {
      process.env.DATABASE_URL = dbUrl;
      super();
    } else {
      // Para SQLite local, utilizar el adaptador de alto rendimiento better-sqlite3
      const adapter = new PrismaBetterSqlite3({
        url: dbUrl,
      });
      super({ adapter });
    }
  }

  // Se conecta a la base de datos al inicializar el módulo
  async onModuleInit() {
    await this.$connect();
  }

  // Se desconecta al cerrar la aplicación
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
