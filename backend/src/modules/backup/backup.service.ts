import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { pipeline } from 'stream/promises';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDirectory = path.join(process.cwd(), 'backups');

  constructor() {
    this.ensureBackupDirectoryExists();
  }

  private ensureBackupDirectoryExists() {
    if (!fs.existsSync(this.backupDirectory)) {
      fs.mkdirSync(this.backupDirectory, { recursive: true });
    }
  }

  private getDatabasePath(): string {
    const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
    if (dbUrl.startsWith('file:')) {
      return path.resolve(process.cwd(), dbUrl.replace('file:', ''));
    }
    // Fallback estándar si no es un string local
    return path.resolve(process.cwd(), 'dev.db');
  }

  // Cron programado para ejecutarse todos los días a las 00:00 (Medianoche)
  @Cron('0 0 * * *')
  async handleAutoBackup() {
    this.logger.log('Iniciando respaldo automático programado...');
    try {
      const result = await this.createBackup();
      this.logger.log(`Respaldo automático completado con éxito: ${result.filename}`);
    } catch (err) {
      this.logger.error('Fallo en el respaldo automático:', err);
    }
  }

  // Crear un nuevo respaldo comprimido (.db.gz)
  async createBackup() {
    const dbPath = this.getDatabasePath();
    if (!fs.existsSync(dbPath)) {
      throw new BadRequestException('La base de datos SQLite local (dev.db) no existe.');
    }

    this.ensureBackupDirectoryExists();

    const timestamp = new Date()
      .toISOString()
      .replace(/T/, '_')
      .replace(/\..+/, '')
      .replace(/:/g, '-');
      
    const filename = `backup_${timestamp}.db.gz`;
    const destPath = path.join(this.backupDirectory, filename);
    const tempPath = path.join(this.backupDirectory, `temp_${timestamp}.db`);

    try {
      // 1. Copiar el archivo dev.db a un archivo temporal para no bloquear lecturas de SQLite
      fs.copyFileSync(dbPath, tempPath);

      // 2. Comprimir el archivo temporal en Gzip de forma asíncrona usando pipelines
      const sourceStream = fs.createReadStream(tempPath);
      const gzipStream = zlib.createGzip();
      const destStream = fs.createWriteStream(destPath);

      await pipeline(sourceStream, gzipStream, destStream);

      // 3. Eliminar el archivo temporal
      fs.unlinkSync(tempPath);

      // 4. Ejecutar rotación de respaldos para conservar solo los últimos 7
      await this.rotateBackups();

      const stats = fs.statSync(destPath);

      return {
        filename,
        sizeBytes: stats.size,
        createdAt: stats.mtime,
      };
    } catch (err) {
      // Limpieza de emergencia del archivo temporal si ocurre algún error
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      this.logger.error(`Error al crear el respaldo: ${err.message}`, err.stack);
      throw new BadRequestException(`No se pudo crear el respaldo: ${err.message}`);
    }
  }

  // Mantener solo los últimos 7 respaldos
  async rotateBackups() {
    try {
      const files = fs.readdirSync(this.backupDirectory);
      const backupFiles = files
        .filter((file) => file.startsWith('backup_') && file.endsWith('.db.gz'))
        .map((file) => {
          const filePath = path.join(this.backupDirectory, file);
          const stats = fs.statSync(filePath);
          return { name: file, path: filePath, mtime: stats.mtime.getTime() };
        })
        .sort((a, b) => b.mtime - a.mtime); // De más recientes a más antiguos

      if (backupFiles.length > 7) {
        const filesToDelete = backupFiles.slice(7);
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          this.logger.log(`Rotación de respaldos: eliminado respaldo antiguo ${file.name}`);
        }
      }
    } catch (err) {
      this.logger.error('Error durante la rotación de respaldos:', err);
    }
  }

  // Obtener listado de todos los respaldos locales
  async listBackups() {
    this.ensureBackupDirectoryExists();
    try {
      const files = fs.readdirSync(this.backupDirectory);
      return files
        .filter((file) => file.startsWith('backup_') && file.endsWith('.db.gz'))
        .map((file) => {
          const filePath = path.join(this.backupDirectory, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            sizeBytes: stats.size,
            createdAt: stats.mtime,
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Orden descendente
    } catch (err) {
      throw new BadRequestException('No se pudo listar los respaldos.');
    }
  }

  // Ruta absoluta de un respaldo para descarga
  getBackupPath(filename: string): string {
    const filePath = path.join(this.backupDirectory, filename);
    // Evitar ataques de evasión de directorios (Path Traversal)
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(this.backupDirectory)) {
      throw new BadRequestException('Nombre de archivo de respaldo no válido.');
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new NotFoundException(`El respaldo ${filename} no existe.`);
    }

    return resolvedPath;
  }

  // Eliminar un respaldo manualmente
  async deleteBackup(filename: string) {
    const filePath = this.getBackupPath(filename);
    try {
      fs.unlinkSync(filePath);
      return { message: `El respaldo ${filename} fue eliminado exitosamente.` };
    } catch (err) {
      throw new BadRequestException(`No se pudo eliminar el respaldo: ${err.message}`);
    }
  }
}
