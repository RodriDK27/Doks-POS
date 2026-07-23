import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { FileLoggerService } from './common/logger/file-logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return;
      
      const parts = trimmedLine.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join('=').trim();
        
        // Limpiar comillas
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1).trim();
        }
        
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error('\x1b[31m[CONFIG ERROR] Error crítico de inicio de servidor:\x1b[0m');
    console.error('\x1b[31mFaltan configurar las siguientes variables de entorno requeridas en el archivo .env:\x1b[0m');
    missing.forEach((variable) => {
      console.error(`\x1b[33m  - ${variable}\x1b[0m`);
    });
    console.error('\x1b[31mEl servidor se detendrá por seguridad.\x1b[0m\n');
    process.exit(1);
  }
}

async function bootstrap() {
  // Cargar variables de entorno del archivo .env local
  loadEnv();

  // Validar variables de entorno de forma estricta antes de levantar el servidor
  validateEnv();

  // Sincronizar esquema de base de datos automáticamente en producción/servidor remoto
  if (process.env.DATABASE_URL) {
    try {
      const { execSync } = require('child_process');
      console.log('[DB AUTO-MIGRATION] Sincronizando esquema de base de datos...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('[DB AUTO-MIGRATION] Base de datos sincronizada correctamente.');
    } catch (dbErr) {
      console.error('[DB AUTO-MIGRATION WARNING] Error al auto-sincronizar base de datos:', dbErr);
    }
  }

  // Instanciar el logger de archivo y consola
  const logger = new FileLoggerService();

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // Habilitar CORS de forma explícita para permitir peticiones de Vercel y cabeceras de autorización
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
    credentials: true,
  });

  // Configurar prefijo global para las rutas de la API
  app.setGlobalPrefix('api');

  // Configurar Swagger para documentación interactiva de la API
  const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
  const config = new DocumentBuilder()
    .setTitle("Dok's POS API")
    .setDescription('Especificación técnica interactiva de los endpoints del backend para Dok\'s POS.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Registrar el filtro de excepciones global para formatear errores y evitar fugas
  app.useGlobalFilters(new HttpExceptionFilter());

  // Habilitar validación automática global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // Rechaza peticiones con propiedades extras no permitidas
      transform: true, // Convierte tipos automáticamente (ej. string a number)
    }),
  );

  const port = process.env.PORT ?? 3001; // Usamos 3001 ya que Next.js típicamente usa 3000
  await app.listen(port);
  logger.log(`Backend de Dok's POS ejecutándose en: http://localhost:${port}/api`, 'Bootstrap');
}
bootstrap();
