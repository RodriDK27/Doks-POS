import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecordVaultTransactionDto, VaultTransactionType, AdjustVaultBalanceDto } from './dto/record-vault-transaction.dto';

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene o inicializa la entidad única de Caja Grande (MAIN_VAULT)
   */
  async getVaultState() {
    let vault = await this.prisma.mainVault.findUnique({
      where: { id: 'MAIN_VAULT' },
    });

    if (!vault) {
      vault = await this.prisma.mainVault.create({
        data: {
          id: 'MAIN_VAULT',
          balance: 0,
        },
      });
    }

    // Calcular estadísticas acumuladas de la Caja Grande
    const aggregates = await this.prisma.mainVaultTransaction.groupBy({
      by: ['type'],
      _sum: { amount: true },
    });

    const statsMap: Record<string, number> = {};
    aggregates.forEach((agg) => {
      statsMap[agg.type] = Math.abs(agg._sum.amount || 0);
    });

    return {
      vault,
      metrics: {
        totalDepositsFromClosures: statsMap[VaultTransactionType.DEPOSITO_CORTE] || 0,
        totalSupplierPayments: statsMap[VaultTransactionType.EGRESO_PROVEEDOR] || 0,
        totalProfitWithdrawals: statsMap[VaultTransactionType.RETIRO_UTILIDAD] || 0,
        totalOperationalExpenses: statsMap[VaultTransactionType.GASTO_OPERATIVO] || 0,
        totalManualDeposits: statsMap[VaultTransactionType.ENTRADA_MANUAL] || 0,
      },
    };
  }

  /**
   * Obtener historial de transacciones de la Caja Grande con filtros
   */
  async getTransactions(type?: string, startDate?: string, endDate?: string) {
    const whereClause: any = {};

    if (type) {
      whereClause.type = type;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    return this.prisma.mainVaultTransaction.findMany({
      where: whereClause,
      include: {
        cashRegister: {
          select: { id: true, openedBy: true, closedAt: true },
        },
        purchase: {
          select: { id: true, total: true, supplier: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Registrar un movimiento manual (Retiro de utilidad, Gasto operativo o Entrada manual)
   */
  async recordTransaction(dto: RecordVaultTransactionDto) {
    const { vault } = await this.getVaultState();
    const isExpense = [
      VaultTransactionType.RETIRO_UTILIDAD,
      VaultTransactionType.GASTO_OPERATIVO,
      VaultTransactionType.EGRESO_PROVEEDOR,
    ].includes(dto.type);

    const signedAmount = isExpense ? -Math.abs(dto.amount) : Math.abs(dto.amount);

    if (isExpense && vault.balance + signedAmount < 0) {
      throw new BadRequestException(
        `Fondos insuficientes en Caja Grande. Saldo actual: $${vault.balance.toFixed(2)}, Intento de egreso: $${dto.amount.toFixed(2)}`
      );
    }

    const newBalance = vault.balance + signedAmount;

    return this.prisma.$transaction(async (tx) => {
      const updatedVault = await tx.mainVault.update({
        where: { id: 'MAIN_VAULT' },
        data: { balance: newBalance },
      });

      const transaction = await tx.mainVaultTransaction.create({
        data: {
          type: dto.type,
          amount: signedAmount,
          balanceAfter: newBalance,
          description: dto.description.trim(),
          cashRegisterId: dto.cashRegisterId || null,
          purchaseId: dto.purchaseId || null,
          createdByName: dto.createdByName || null,
        },
      });

      return { vault: updatedVault, transaction };
    });
  }

  /**
   * Depósito automático de excedente al cerrar un turno de Caja Chica
   */
  async depositFromRegisterClosure(
    cashRegisterId: string,
    surplusAmount: number,
    description: string,
    createdByName?: string,
  ) {
    if (surplusAmount <= 0) return null;

    const { vault } = await this.getVaultState();
    const newBalance = vault.balance + surplusAmount;

    return this.prisma.$transaction(async (tx) => {
      const updatedVault = await tx.mainVault.update({
        where: { id: 'MAIN_VAULT' },
        data: { balance: newBalance },
      });

      const transaction = await tx.mainVaultTransaction.create({
        data: {
          type: VaultTransactionType.DEPOSITO_CORTE,
          amount: surplusAmount,
          balanceAfter: newBalance,
          description,
          cashRegisterId,
          createdByName,
        },
      });

      return { vault: updatedVault, transaction };
    });
  }

  /**
   * Descontar pago de proveedor pagado desde Caja Grande
   */
  async deductForSupplierPayment(
    purchaseId: string | null | undefined,
    amount: number,
    description: string,
    createdByName?: string,
  ) {
    const { vault } = await this.getVaultState();
    const expense = Math.abs(amount);

    if (vault.balance < expense) {
      throw new BadRequestException(
        `Saldo insuficiente en Caja Grande ($${vault.balance.toFixed(2)}) para pagar $${expense.toFixed(2)} al proveedor.`
      );
    }

    const newBalance = vault.balance - expense;

    return this.prisma.$transaction(async (tx) => {
      const updatedVault = await tx.mainVault.update({
        where: { id: 'MAIN_VAULT' },
        data: { balance: newBalance },
      });

      const transaction = await tx.mainVaultTransaction.create({
        data: {
          type: VaultTransactionType.EGRESO_PROVEEDOR,
          amount: -expense,
          balanceAfter: newBalance,
          description,
          purchaseId: purchaseId || undefined,
          createdByName,
        },
      });

      return { vault: updatedVault, transaction };
    });
  }

  /**
   * Realizar ajuste manual de saldo / auditoría de Caja Grande
   */
  async adjustBalance(dto: AdjustVaultBalanceDto) {
    const { vault } = await this.getVaultState();
    const diff = dto.newBalance - vault.balance;

    if (diff === 0) {
      throw new BadRequestException('El nuevo saldo coincide exactamente con el saldo actual.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedVault = await tx.mainVault.update({
        where: { id: 'MAIN_VAULT' },
        data: { balance: dto.newBalance },
      });

      const transaction = await tx.mainVaultTransaction.create({
        data: {
          type: VaultTransactionType.AJUSTE_SALDO,
          amount: diff,
          balanceAfter: dto.newBalance,
          description: dto.description.trim(),
          createdByName: dto.createdByName || null,
        },
      });

      return { vault: updatedVault, transaction };
    });
  }

  /**
   * Reporte de Utilidad Real Neta del Negocio
   */
  async getProfitReport() {
    const { vault, metrics } = await this.getVaultState();

    // 1. Total ventas registradas
    const totalSales = await this.prisma.sale.aggregate({
      _sum: { total: true },
    });
    const grossRevenue = totalSales._sum.total || 0;

    // 2. Costo estimado de ventas (Costo de adquisición de productos vendidos)
    const saleItems = await this.prisma.saleItem.findMany({
      include: { product: { select: { purchasePrice: true } } },
    });

    const costOfGoodsSold = saleItems.reduce((acc, item) => {
      const cost = item.product?.purchasePrice || 0;
      return acc + (cost * item.quantity);
    }, 0);

    const grossProfit = grossRevenue - costOfGoodsSold;

    // 3. Gastos operativos totales pagados desde Caja Grande
    const operationalExpenses = metrics.totalOperationalExpenses;

    // 4. Utilidades efectivamente retiradas por el dueño
    const profitWithdrawn = metrics.totalProfitWithdrawals;

    // 5. Ganancia Real Neta Disponible = Utilidad Bruta - Gastos Operativos
    const netRealProfit = grossProfit - operationalExpenses;

    return {
      currentVaultBalance: vault.balance,
      grossRevenue,
      costOfGoodsSold,
      grossProfit,
      operationalExpenses,
      netRealProfit,
      profitWithdrawn,
      netProfitRemaining: netRealProfit - profitWithdrawn,
    };
  }
}
