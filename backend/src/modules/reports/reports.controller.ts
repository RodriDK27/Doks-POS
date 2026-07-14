import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Response } from 'express';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('register/:id/pdf')
  @Roles('ADMIN', 'CAJERO')
  async downloadRegisterReportPdf(@Param('id') id: string, @Res() res: Response) {
    return this.reportsService.generateRegisterReportPdf(id, res);
  }
}
