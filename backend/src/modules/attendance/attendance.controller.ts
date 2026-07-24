import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  async clockIn(@Body() body: { pin: string; notes?: string }) {
    return this.attendanceService.clockIn(body.pin, body.notes);
  }

  @Post('clock-out')
  async clockOut(@Body() body: { pin: string; notes?: string }) {
    return this.attendanceService.clockOut(body.pin, body.notes);
  }

  @Post('clock-out-by-name')
  async clockOutByName(@Body() body: { employeeName: string; notes?: string }) {
    return this.attendanceService.clockOutByName(body.employeeName, body.notes);
  }

  @Get('active')
  async getActiveSessions() {
    return this.attendanceService.getActiveSessions();
  }

  @Get('summary')
  async getWeeklySummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getWeeklySummary(startDate, endDate);
  }
}
