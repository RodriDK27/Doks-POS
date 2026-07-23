import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateSupplierDto {
  @IsString({ message: 'El nombre del proveedor debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del proveedor es obligatorio' })
  name: string;

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
}
