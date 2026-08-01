import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum VaultTransactionType {
  DEPOSITO_CORTE = 'DEPOSITO_CORTE',
  EGRESO_PROVEEDOR = 'EGRESO_PROVEEDOR',
  RETIRO_UTILIDAD = 'RETIRO_UTILIDAD',
  GASTO_OPERATIVO = 'GASTO_OPERATIVO',
  ENTRADA_MANUAL = 'ENTRADA_MANUAL',
  AJUSTE_SALDO = 'AJUSTE_SALDO',
}

export class RecordVaultTransactionDto {
  @IsEnum(VaultTransactionType, { message: 'Tipo de transacción no válido' })
  type: VaultTransactionType;

  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0.01, { message: 'El monto debe ser mayor a cero' })
  amount: number;

  @IsString()
  @IsNotEmpty({ message: 'El concepto o descripción es obligatorio' })
  description: string;

  @IsString()
  @IsOptional()
  cashRegisterId?: string;

  @IsString()
  @IsOptional()
  purchaseId?: string;

  @IsString()
  @IsOptional()
  createdByName?: string;
}

export class AdjustVaultBalanceDto {
  @IsNumber({}, { message: 'El nuevo saldo debe ser un número válido' })
  @Min(0, { message: 'El saldo no puede ser negativo' })
  newBalance: number;

  @IsString()
  @IsNotEmpty({ message: 'Indica la razón o justificación del ajuste' })
  description: string;

  @IsString()
  @IsOptional()
  createdByName?: string;
}
