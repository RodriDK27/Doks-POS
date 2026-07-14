import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

@Controller('system')
export class SystemController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async getHealth() {
    let databaseStatus = 'up';
    let dbError: string | undefined = undefined;
    const startDb = Date.now();
    let latencyMs = 0;

    try {
      // Ejecutar consulta ligera e independiente para medir latencia de la base de datos
      await this.prisma.$queryRaw`SELECT 1`;
      latencyMs = Date.now() - startDb;
    } catch (err) {
      databaseStatus = 'down';
      dbError = err.message;
    }

    let dbSizeBytes = 0;
    try {
      const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
      if (dbUrl.startsWith('file:')) {
        const dbPath = path.resolve(process.cwd(), dbUrl.replace('file:', ''));
        if (fs.existsSync(dbPath)) {
          dbSizeBytes = fs.statSync(dbPath).size;
        }
      }
    } catch (err) {
      // Ignorar errores menores al consultar tamaño de la bd
    }

    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const freePercentage = Math.round((freeMem / totalMem) * 100);
    const memoryUsageNode = process.memoryUsage();

    return {
      status: databaseStatus === 'up' ? 'up' : 'down',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: databaseStatus,
          latencyMs: databaseStatus === 'up' ? latencyMs : undefined,
          error: dbError,
        },
        memory: {
          freePercentage,
          freeMb: Math.round(freeMem / (1024 * 1024)),
          totalMb: Math.round(totalMem / (1024 * 1024)),
        },
        process: {
          uptimeSeconds: Math.round(process.uptime()),
          heapUsedMb: Math.round(memoryUsageNode.heapUsed / (1024 * 1024)),
          rssMb: Math.round(memoryUsageNode.rss / (1024 * 1024)),
        },
        storage: {
          dbSizeBytes,
        },
      },
    };
  }
}
