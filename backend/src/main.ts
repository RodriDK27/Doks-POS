import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir peticiones del frontend
  app.enableCors();

  // Configurar prefijo global para las rutas de la API
  app.setGlobalPrefix('api');

  // Habilitar validación automática global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve propiedades no declaradas en el DTO
      transform: true, // Convierte tipos automáticamente (ej. string a number)
    }),
  );

  const port = process.env.PORT ?? 3001; // Usamos 3001 ya que Next.js típicamente usa 3000
  await app.listen(port);
  console.log(`Backend de Dok's POS ejecutándose en: http://localhost:${port}/api`);
}
bootstrap();
