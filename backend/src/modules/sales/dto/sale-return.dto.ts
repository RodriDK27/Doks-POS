import { IsArray, IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnItemDto {
  @IsString({ message: 'El artículo a devolver debe ser texto' })
  @IsNotEmpty({ message: 'Debe indicar el artículo a devolver' })
  saleItemId: string;

  @IsNumber({}, { message: 'La cantidad a devolver debe ser un número' })
  @Min(0.001, { message: 'La cantidad a devolver debe ser mayor a 0' })
  quantity: number;
}

export class ReplacementItemDto {
  @IsString({ message: 'El ID del producto debe ser texto' })
  @IsNotEmpty({ message: 'Debe elegir el producto a cambio' })
  productId: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0.001, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number;
}

export class CreateSaleReturnDto {
  @IsArray({ message: 'Los artículos a devolver deben ser una lista' })
  @ArrayMinSize(1, { message: 'Seleccione al menos un artículo a devolver' })
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

  /** false = la mercancía viene dañada/caducada y no regresa al inventario */
  @IsBoolean({ message: 'restock debe ser verdadero o falso' })
  @IsOptional()
  restock?: boolean;

  @IsString({ message: 'El motivo debe ser texto' })
  @MaxLength(200, { message: 'El motivo no puede tener más de 200 caracteres' })
  @IsOptional()
  reason?: string;

  /** Productos que el cliente se lleva a cambio (si se envían, es un cambio y no solo devolución) */
  @IsArray({ message: 'Los productos a cambio deben ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => ReplacementItemDto)
  @IsOptional()
  replacementItems?: ReplacementItemDto[];
}

export class ChangePaymentMethodDto {
  @IsString({ message: 'El método de pago debe ser texto' })
  @IsIn(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'FIADO'], {
    message: 'El método de pago debe ser: EFECTIVO, TARJETA, TRANSFERENCIA o FIADO',
  })
  paymentMethod: string;

  @IsString({ message: 'El ID del cliente debe ser texto' })
  @IsOptional()
  customerId?: string;
}
