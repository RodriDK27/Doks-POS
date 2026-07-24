import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByPin(pin: string) {
    const users = await this.prisma.user.findMany();
    for (const u of users) {
      const match = await bcrypt.compare(pin, u.pin);
      if (match) return u;
    }
    return null;
  }

  async clockIn(pin: string, notes?: string) {
    const user = await this.findUserByPin(pin);
    if (!user) {
      throw new BadRequestException('PIN de seguridad incorrecto.');
    }

    const activeSession = await this.prisma.attendance.findFirst({
      where: {
        userId: user.id,
        clockOut: null,
      },
    });

    if (activeSession) {
      throw new BadRequestException(`El usuario ${user.name} ya registró su Entrada previamente.`);
    }

    return this.prisma.attendance.create({
      data: {
        userId: user.id,
        clockIn: new Date(),
        notes,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, hourlyRate: true, dailySalary: true },
        },
      },
    });
  }

  async clockOut(pin: string, notes?: string) {
    const user = await this.findUserByPin(pin);
    if (!user) {
      throw new BadRequestException('PIN de seguridad incorrecto.');
    }

    const activeSession = await this.prisma.attendance.findFirst({
      where: {
        userId: user.id,
        clockOut: null,
      },
    });

    if (!activeSession) {
      throw new BadRequestException(`El usuario ${user.name} no tiene un turno de Entrada activo.`);
    }

    const now = new Date();
    const diffMs = now.getTime() - new Date(activeSession.clockIn).getTime();
    const hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    const hourlyRate = user.hourlyRate || 0;
    const dailySalary = user.dailySalary || 0;
    let payAmount = 0;

    if (hourlyRate > 0) {
      payAmount = Math.round(hoursWorked * hourlyRate * 100) / 100;
    } else if (dailySalary > 0 && hoursWorked >= 4) {
      payAmount = dailySalary;
    }

    return this.prisma.attendance.update({
      where: { id: activeSession.id },
      data: {
        clockOut: now,
        hoursWorked,
        payAmount,
        notes: notes ? `${activeSession.notes || ''} ${notes}`.trim() : activeSession.notes,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, hourlyRate: true, dailySalary: true },
        },
      },
    });
  }

  async clockOutByName(employeeName: string, notes?: string) {
    const user = await this.prisma.user.findFirst({
      where: { name: employeeName },
    });

    if (!user) return null;

    const activeSession = await this.prisma.attendance.findFirst({
      where: {
        userId: user.id,
        clockOut: null,
      },
    });

    if (!activeSession) return null;

    const now = new Date();
    const diffMs = now.getTime() - new Date(activeSession.clockIn).getTime();
    const hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    const hourlyRate = user.hourlyRate || 0;
    const dailySalary = user.dailySalary || 0;
    let payAmount = 0;

    if (hourlyRate > 0) {
      payAmount = Math.round(hoursWorked * hourlyRate * 100) / 100;
    } else if (dailySalary > 0 && hoursWorked >= 4) {
      payAmount = dailySalary;
    }

    return this.prisma.attendance.update({
      where: { id: activeSession.id },
      data: {
        clockOut: now,
        hoursWorked,
        payAmount,
        notes: notes ? `${activeSession.notes || ''} ${notes}`.trim() : activeSession.notes,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, hourlyRate: true, dailySalary: true },
        },
      },
    });
  }

  async getActiveSessions() {
    return this.prisma.attendance.findMany({
      where: { clockOut: null },
      include: {
        user: {
          select: { id: true, name: true, role: true, hourlyRate: true, dailySalary: true },
        },
      },
    });
  }

  async getWeeklySummary(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const logs = await this.prisma.attendance.findMany({
      where: {
        clockIn: {
          gte: start,
          lte: end,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, hourlyRate: true, dailySalary: true },
        },
      },
      orderBy: { clockIn: 'desc' },
    });

    const summaryByUser: Record<string, { userId: string; userName: string; totalHours: number; totalPay: number; shiftsCount: number }> = {};

    logs.forEach((log) => {
      const uid = log.userId;
      if (!summaryByUser[uid]) {
        summaryByUser[uid] = {
          userId: uid,
          userName: log.user.name,
          totalHours: 0,
          totalPay: 0,
          shiftsCount: 0,
        };
      }

      summaryByUser[uid].totalHours += log.hoursWorked || 0;
      summaryByUser[uid].totalPay += log.payAmount || 0;
      summaryByUser[uid].shiftsCount += 1;
    });

    const totalHoursAll = Object.values(summaryByUser).reduce((acc, curr) => acc + curr.totalHours, 0);
    const totalPayrollAll = Object.values(summaryByUser).reduce((acc, curr) => acc + curr.totalPay, 0);

    return {
      period: { start, end },
      byUser: Object.values(summaryByUser),
      totalHours: Math.round(totalHoursAll * 100) / 100,
      totalPayroll: Math.round(totalPayrollAll * 100) / 100,
      logs,
    };
  }
}
