import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateRegisterReportPdf(registerId: string, res: Response) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id: registerId },
      include: {
        transactions: { orderBy: { createdAt: 'asc' } },
        sales: {
          orderBy: { createdAt: 'asc' },
          include: {
            items: true,
            customer: true,
          },
        },
      },
    });

    if (!register) {
      throw new NotFoundException(`La sesión de caja con ID ${registerId} no existe.`);
    }

    // Instanciar documento PDFKit
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

    // Configurar cabeceras HTTP para descarga directa
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=corte_caja_${registerId.substring(0, 8)}.pdf`);
    doc.pipe(res);

    // Título Principal
    doc
      .fillColor('#1e293b')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('REPORTE DE CORTE DE CAJA', { align: 'center', underline: true })
      .moveDown(0.2);

    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .fillColor('#64748b')
      .text("Dok's POS - Sistema de Control y Ventas", { align: 'center' })
      .moveDown(1.5);

    // Información de Metadatos
    const startY = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('DETALLE DEL TURNO', 50, startY)
      .font('Helvetica')
      .fillColor('#334155')
      .text(`Folio de Sesión: ${register.id.substring(0, 8).toUpperCase()}...`, 50, startY + 15)
      .text(`Cajero a cargo: ${register.openedBy}`, 50, startY + 30)
      .text(`Estado de Caja: ${register.status}`, 50, startY + 45);

    const formatTime = (date: Date | null) =>
      date ? new Date(date).toLocaleString('es-MX', { hour12: true }) : 'Sesión Activa';

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('FECHAS Y HORARIOS', 320, startY)
      .font('Helvetica')
      .fillColor('#334155')
      .text(`Fecha de Apertura: ${formatTime(register.openedAt)}`, 320, startY + 15)
      .text(`Fecha de Cierre:   ${formatTime(register.closedAt)}`, 320, startY + 30);

    doc.moveDown(4);

    // Línea separadora
    doc
      .strokeColor('#cbd5e1')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(562, doc.y)
      .stroke()
      .moveDown(1.5);

    // Cálculos Financieros
    let totalSalesCash = 0;
    let totalSalesCard = 0;
    let totalSalesTransfer = 0;
    let totalSalesFiado = 0;

    register.sales.forEach((s) => {
      if (s.paymentMethod === 'EFECTIVO') totalSalesCash += s.total;
      else if (s.paymentMethod === 'TARJETA') totalSalesCard += s.total;
      else if (s.paymentMethod === 'TRANSFERENCIA') totalSalesTransfer += s.total;
      else if (s.paymentMethod === 'FIADO') totalSalesFiado += s.total;
    });

    let totalIncomes = 0;
    let totalExpenses = 0;
    register.transactions.forEach((t) => {
      if (t.amount > 0) totalIncomes += t.amount;
      else totalExpenses += Math.abs(t.amount);
    });

    const expectedBalance = register.expectedBalance;
    const actualBalance = register.actualBalance ?? expectedBalance;
    const difference = actualBalance - expectedBalance;

    // Resumen de Caja Chica (Columna Izquierda)
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('Flujo de Efectivo en Caja', 50, doc.y)
      .moveDown(0.6);

    const balanceY = doc.y;
    doc
      .fontSize(9.5)
      .font('Helvetica')
      .fillColor('#475569')
      .text('Fondo Inicial de Caja:', 50, balanceY)
      .font('Helvetica-Bold')
      .text(`$${register.initialBalance.toFixed(2)}`, 200, balanceY, { align: 'right', width: 80 })
      
      .font('Helvetica')
      .text('Ventas en Efectivo (+):', 50, balanceY + 15)
      .font('Helvetica-Bold')
      .text(`$${totalSalesCash.toFixed(2)}`, 200, balanceY + 15, { align: 'right', width: 80 })
      
      .font('Helvetica')
      .text('Ingresos de Caja (+):', 50, balanceY + 30)
      .font('Helvetica-Bold')
      .text(`$${totalIncomes.toFixed(2)}`, 200, balanceY + 30, { align: 'right', width: 80 })
      
      .font('Helvetica')
      .text('Egresos de Caja (-):', 50, balanceY + 45)
      .font('Helvetica-Bold')
      .text(`$${totalExpenses.toFixed(2)}`, 200, balanceY + 45, { align: 'right', width: 80 })

      .strokeColor('#cbd5e1')
      .lineWidth(0.5)
      .moveTo(50, balanceY + 62)
      .lineTo(280, balanceY + 62)
      .stroke()
      
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text('Saldo Esperado en Caja:', 50, balanceY + 68)
      .text(`$${expectedBalance.toFixed(2)}`, 200, balanceY + 68, { align: 'right', width: 80 })
      
      .text('Saldo Contado (Arqueo):', 50, balanceY + 83)
      .text(`$${actualBalance.toFixed(2)}`, 200, balanceY + 83, { align: 'right', width: 80 });

    const diffColor = difference < 0 ? '#b91c1c' : difference > 0 ? '#d97706' : '#15803d';
    doc
      .fillColor(diffColor)
      .text('Diferencia (Sobrante/Faltante):', 50, balanceY + 98)
      .text(`${difference >= 0 ? '+' : ''}$${difference.toFixed(2)}`, 200, balanceY + 98, { align: 'right', width: 80 });

    // Desglose de Ventas por Método de Pago (Columna Derecha)
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('Ventas Totales por Método', 320, balanceY - 20)
      .moveDown(0.6);

    doc
      .fontSize(9.5)
      .font('Helvetica')
      .fillColor('#475569')
      .text('Efectivo:', 320, balanceY)
      .font('Helvetica-Bold')
      .text(`$${totalSalesCash.toFixed(2)}`, 470, balanceY, { align: 'right', width: 80 })
      
      .font('Helvetica')
      .text('Tarjeta (Crédito/Débito):', 320, balanceY + 15)
      .font('Helvetica-Bold')
      .text(`$${totalSalesCard.toFixed(2)}`, 470, balanceY + 15, { align: 'right', width: 80 })
      
      .font('Helvetica')
      .text('Transferencia Bancaria:', 320, balanceY + 30)
      .font('Helvetica-Bold')
      .text(`$${totalSalesTransfer.toFixed(2)}`, 470, balanceY + 30, { align: 'right', width: 80 })
      
      .font('Helvetica')
      .text('Fiado / Cuentas por Cobrar:', 320, balanceY + 45)
      .font('Helvetica-Bold')
      .text(`$${totalSalesFiado.toFixed(2)}`, 470, balanceY + 45, { align: 'right', width: 80 })

      .strokeColor('#cbd5e1')
      .lineWidth(0.5)
      .moveTo(320, balanceY + 62)
      .lineTo(550, balanceY + 62)
      .stroke()

      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text('Total Acumulado Ventas:', 320, balanceY + 68)
      .text(`$${(totalSalesCash + totalSalesCard + totalSalesTransfer + totalSalesFiado).toFixed(2)}`, 470, balanceY + 68, { align: 'right', width: 80 });

    doc.moveDown(8);

    // Línea separadora
    doc
      .strokeColor('#cbd5e1')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(562, doc.y)
      .stroke()
      .moveDown(1.5);

    // Listado de Transacciones de Caja
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('Movimientos Manuales de Efectivo (Auditoría)')
      .moveDown(0.5);

    if (register.transactions.length === 0) {
      doc
        .fontSize(9)
        .font('Helvetica-Oblique')
        .fillColor('#64748b')
        .text('No se registraron movimientos manuales de caja en este turno.')
        .moveDown(1.5);
    } else {
      let tableY = doc.y;
      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor('#475569')
        .text('Tipo', 50, tableY)
        .text('Monto', 120, tableY)
        .text('Hora', 190, tableY)
        .text('Motivo / Descripción', 260, tableY);

      doc
        .strokeColor('#cbd5e1')
        .lineWidth(0.5)
        .moveTo(50, tableY + 12)
        .lineTo(550, tableY + 12)
        .stroke();

      tableY += 18;

      doc.font('Helvetica').fillColor('#334155');
      register.transactions.forEach((t) => {
        if (tableY > 700) {
          doc.addPage();
          tableY = 50;
        }

        const sign = t.amount >= 0 ? '+' : '';
        const tColor = t.type === 'INGRESO' ? '#15803d' : '#b91c1c';

        doc
          .fillColor(tColor)
          .text(t.type, 50, tableY)
          .text(`${sign}$${t.amount.toFixed(2)}`, 120, tableY)
          .fillColor('#334155')
          .text(new Date(t.createdAt).toLocaleTimeString('es-MX', { hour12: true }), 190, tableY)
          .text(t.description || 'Sin descripción', 260, tableY);

        tableY += 15;
      });
      doc.y = tableY;
      doc.moveDown(1.5);
    }

    // Listado de Ventas
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('Resumen de Ventas del Turno')
      .moveDown(0.5);

    if (register.sales.length === 0) {
      doc
        .fontSize(9)
        .font('Helvetica-Oblique')
        .fillColor('#64748b')
        .text('No se registraron ventas en este turno.')
        .moveDown(1.5);
    } else {
      let salesY = doc.y;
      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor('#475569')
        .text('Folio', 50, salesY)
        .text('Cliente', 100, salesY)
        .text('Método', 230, salesY)
        .text('Descuento', 320, salesY)
        .text('Total', 410, salesY)
        .text('Hora', 485, salesY);

      doc
        .strokeColor('#cbd5e1')
        .lineWidth(0.5)
        .moveTo(50, salesY + 12)
        .lineTo(550, salesY + 12)
        .stroke();

      salesY += 18;

      doc.font('Helvetica').fillColor('#334155');
      register.sales.forEach((s) => {
        if (salesY > 700) {
          doc.addPage();
          salesY = 50;
        }

        const clientName = s.customer?.name || 'Público General';
        const discStr = s.discount > 0 ? `$${s.discount.toFixed(2)}` : '-';

        doc
          .text(`#${s.id}`, 50, salesY)
          .text(clientName.substring(0, 22), 100, salesY)
          .text(s.paymentMethod, 230, salesY)
          .text(discStr, 320, salesY)
          .text(`$${s.total.toFixed(2)}`, 410, salesY)
          .text(new Date(s.createdAt).toLocaleTimeString('es-MX', { hour12: true }), 485, salesY);

        salesY += 15;
      });
    }

    doc.end();
  }
}
