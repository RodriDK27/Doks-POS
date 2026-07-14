import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { FileLoggerService } from './common/logger/file-logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // Instanciar el logger de archivo y consola
  const logger = new FileLoggerService();

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // Habilitar CORS para permitir peticiones del frontend
  app.enableCors();

  // Configurar prefijo global para las rutas de la API
  app.setGlobalPrefix('api');

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
