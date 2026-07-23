import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';

export class UpdateSupplierDto {
  @IsString({ message: 'El nombre del proveedor debe ser texto' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'El teléfono debe ser texto' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'La dirección debe ser texto' })
  @IsOptional()
  address?: string;

  @IsString({ message: 'Los días de pedido deben ser texto' })
  @IsOptional()
  orderDays?: string;

  @IsString({ message: 'Los días de entrega deben ser texto' })
  @IsOptional()
  deliveryDays?: string;

  @IsString({ message: 'La frecuencia debe ser texto' })
  @IsOptional()
  visitFrequency?: string;

  @IsNumber({}, { message: 'El monto estimado debe ser numérico' })
  @Min(0, { message: 'El monto estimado no puede ser negativo' })
  @IsOptional()
  expectedPayment?: number;

  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  @IsOptional()
  isActive?: boolean;
}
