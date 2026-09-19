import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseItemDto {
  @IsString({ message: 'El ID del producto debe ser texto' })
  @IsNotEmpty({ message: 'El ID del producto es obligatorio' })
  productId: string;

  @IsNumber({}, { message: 'El precio de costo debe ser un número' })
  @Min(0, { message: 'El precio de costo no puede ser menor a 0' })
  costPrice: number;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0.001, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number;
}

export class CreatePurchaseDto {
  @IsString({ message: 'El ID del proveedor debe ser texto' })
  @IsOptional()
  supplierId?: string;

  @IsNumber({}, { message: 'El total debe ser un número' })
  @Min(0.01, { message: 'El total debe ser mayor a 0' })
  @IsOptional()
  total?: number;

  @IsBoolean({ message: 'El pago desde caja debe ser un valor booleano' })
  @IsOptional()
  payFromRegister?: boolean;

  @IsString({ message: 'El origen de pago debe ser texto' })
  @IsOptional()
  paymentSource?: 'CAJA_CHICA' | 'CAJA_GRANDE' | 'CREDITO';

  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  notes?: string;

  @IsString({ message: 'El ID del ticket a liquidar debe ser texto' })
  @IsOptional()
  settleTicketId?: string;

  @IsArray({ message: 'Los artículos comprados deben ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  @IsOptional()
  items?: CreatePurchaseItemDto[];
}

