import { IsNumber, IsOptional, IsString, IsArray, ValidateNested, Min, IsNotEmpty, IsIn, IsBoolean, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  @IsString({ message: 'El ID del producto debe ser texto' })
  @IsOptional()
  productId?: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0.001, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number;

  @IsString({ message: 'El nombre genérico debe ser texto' })
  @IsOptional()
  genericName?: string;

  @IsNumber({}, { message: 'El precio genérico debe ser un número' })
  @Min(0, { message: 'El precio genérico no puede ser menor a 0' })
  @IsOptional()
  genericPrice?: number;

  /** Artículo genérico que el administrador debe aclarar después (bandeja "Por aclarar") */
  @IsBoolean({ message: 'needsReview debe ser verdadero o falso' })
  @IsOptional()
  needsReview?: boolean;

  @IsString({ message: 'La familia debe ser texto' })
  @MaxLength(100, { message: 'La familia no puede tener más de 100 caracteres' })
  @IsOptional()
  pendingFamily?: string;
}

export class ResolveSaleItemDto {
  @IsString({ message: 'El ID del producto debe ser texto' })
  @IsNotEmpty({ message: 'Debe elegir un producto' })
  productId: string;
}

export class CreateSaleDto {
  @IsNumber({}, { message: 'El descuento debe ser un número' })
  @Min(0, { message: 'El descuento no puede ser menor a 0' })
  @IsOptional()
  discount?: number;

  @IsString({ message: 'El método de pago debe ser texto' })
  @IsIn(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'FIADO'], {
    message: 'El método de pago debe ser: EFECTIVO, TARJETA, TRANSFERENCIA o FIADO',
  })
  paymentMethod: string;

  @IsNumber({}, { message: 'La cantidad con la que paga debe ser un número' })
  @Min(0, { message: 'La cantidad pagada no puede ser menor a 0' })
  amountPaid: number;

  @IsString({ message: 'El ID del cliente debe ser texto' })
  @IsOptional()
  customerId?: string;

  @IsArray({ message: 'Los productos a comprar deben ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}
