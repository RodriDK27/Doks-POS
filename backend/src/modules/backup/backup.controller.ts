import { Controller, Get, Post, Delete, Param, Res, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Response } from 'express';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  async list() {
    return this.backupService.listBackups();
  }

  @Post('trigger')
  async trigger() {
    return this.backupService.createBackup();
  }

  @Get('download/:filename')
  async download(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.backupService.getBackupPath(filename);
    res.download(filePath, filename);
  }

  @Delete(':filename')
  async delete(@Param('filename') filename: string) {
    return this.backupService.deleteBackup(filename);
  }
}
